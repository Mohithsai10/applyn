from __future__ import annotations

import asyncio
import json
import os
import re
from pathlib import Path
from typing import Literal, TypedDict

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel
from tavily import TavilyClient

from src.rag.store import retrieve_bullets as rag_retrieve_bullets

load_dotenv()

_PROMPTS = Path(__file__).parent.parent.parent / "prompts"
_MODEL = "claude-sonnet-4-20250514"
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

_llm = ChatAnthropic(model=_MODEL, temperature=0)


# ── State ─────────────────────────────────────────────────────────────────────

class GraphState(TypedDict):
    job_url: str
    job_description: str
    top_skills: list[str]
    company_name: str
    seniority_level: str
    relevant_bullets: list[str]
    rewritten_bullets: list[str]
    ats_score_before: float
    ats_score_after: float
    cover_letter: str
    error: str
    retry_count: int


# ── Pydantic schema for structured output ─────────────────────────────────────

class JobAnalysis(BaseModel):
    top_5_skills: list[str]
    company_name: str
    seniority_level: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _clean_html(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer"]):
        tag.decompose()
    return re.sub(r"\s+", " ", soup.get_text(separator=" ")).strip()


async def _playwright_fetch(url: str) -> str:
    from playwright.async_api import async_playwright

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url, wait_until="networkidle", timeout=30_000)
        html = await page.content()
        await browser.close()
    return _clean_html(html)


def _keyword_overlap(bullets: list[str], skills: list[str]) -> float:
    if not skills:
        return 0.0
    combined = " ".join(bullets).lower()
    hits = sum(1 for s in skills if s.lower() in combined)
    return round(hits / len(skills), 4)


# ── Nodes ─────────────────────────────────────────────────────────────────────

async def scrape_job(state: GraphState) -> dict:
    url = state["job_url"]
    delay = 2.0

    for attempt in range(3):
        if attempt > 0:
            await asyncio.sleep(delay)
            delay *= 2
        try:
            resp = requests.get(url, headers=_HEADERS, timeout=15)
            if resp.status_code == 200:
                text = _clean_html(resp.text)
                if len(text) >= 300:
                    return {"job_description": text, "error": ""}

            text = await _playwright_fetch(url)
            if len(text) >= 300:
                return {"job_description": text, "error": ""}
        except Exception as exc:
            last_exc = str(exc)

    return {
        "job_description": "",
        "error": f"scrape_job failed after 3 attempts: {locals().get('last_exc', 'unknown')}",
    }


async def analyze_jd(state: GraphState) -> dict:
    raw = (_PROMPTS / "analyze_jd.txt").read_text()
    # Split instructions from the JD placeholder so the schema-guided LLM sees
    # clean instructions in the system turn and the raw JD in the human turn.
    instructions = raw.split("---\nJOB DESCRIPTION:")[0].strip()
    structured_llm = _llm.with_structured_output(JobAnalysis)
    result: JobAnalysis = await structured_llm.ainvoke(
        [
            SystemMessage(content=instructions),
            HumanMessage(content=state["job_description"]),
        ]
    )
    return {
        "top_skills": result.top_5_skills,
        "company_name": result.company_name,
        "seniority_level": result.seniority_level,
    }


async def retrieve_bullets_node(state: GraphState) -> dict:
    bullets = rag_retrieve_bullets(state["top_skills"])
    return {"relevant_bullets": bullets}


async def rewrite_bullets(state: GraphState) -> dict:
    template = (_PROMPTS / "rewrite_bullets.txt").read_text()
    rewritten: list[str] = []

    for bullet in state["relevant_bullets"]:
        prompt = template.format(
            job_description=state["job_description"],
            original_bullets=bullet,
        )
        response = await _llm.ainvoke([HumanMessage(content=prompt)])
        try:
            parsed = json.loads(response.content)
            if isinstance(parsed, list):
                rewritten.extend(str(b) for b in parsed)
            else:
                rewritten.append(str(parsed))
        except (json.JSONDecodeError, AttributeError):
            rewritten.append(response.content.strip())

    return {
        "rewritten_bullets": rewritten,
        "retry_count": state.get("retry_count", 0) + 1,
    }


async def score_ats(state: GraphState) -> dict:
    before = _keyword_overlap(state.get("relevant_bullets", []), state["top_skills"])
    after = _keyword_overlap(state.get("rewritten_bullets", []), state["top_skills"])
    return {"ats_score_before": before, "ats_score_after": after}


async def generate_cover(state: GraphState) -> dict:
    news_snippet = ""
    try:
        tavily = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])
        results = tavily.search(
            f"{state['company_name']} company news latest", max_results=1
        )
        if results.get("results"):
            news_snippet = results["results"][0].get("content", "")[:500]
    except Exception:
        pass

    template = (_PROMPTS / "cover_letter.txt").read_text()
    resume_summary = "\n".join(state.get("rewritten_bullets", []))
    prompt = template.format(
        resume_summary=resume_summary,
        job_description=state["job_description"][:2_000],
        company_name=state["company_name"],
        role_title=state["seniority_level"],
    )
    if news_snippet:
        prompt += f"\n\nRECENT COMPANY NEWS (use to personalise the opening):\n{news_snippet}"

    response = await _llm.ainvoke([HumanMessage(content=prompt)])
    return {"cover_letter": response.content.strip()}


# ── Routing ───────────────────────────────────────────────────────────────────

def _route_after_score(
    state: GraphState,
) -> Literal["rewrite_bullets", "generate_cover"]:
    if state["ats_score_after"] < 0.70 and state.get("retry_count", 0) < 2:
        return "rewrite_bullets"
    return "generate_cover"


# ── Graph construction ────────────────────────────────────────────────────────

def build_graph() -> StateGraph:
    builder = StateGraph(GraphState)

    builder.add_node("scrape_job", scrape_job)
    builder.add_node("analyze_jd", analyze_jd)
    builder.add_node("retrieve_bullets", retrieve_bullets_node)
    builder.add_node("rewrite_bullets", rewrite_bullets)
    builder.add_node("score_ats", score_ats)
    builder.add_node("generate_cover", generate_cover)

    builder.add_edge(START, "scrape_job")
    builder.add_edge("scrape_job", "analyze_jd")
    builder.add_edge("analyze_jd", "retrieve_bullets")
    builder.add_edge("retrieve_bullets", "rewrite_bullets")
    builder.add_edge("rewrite_bullets", "score_ats")
    builder.add_conditional_edges("score_ats", _route_after_score)
    builder.add_edge("generate_cover", END)

    return builder


_checkpointer = MemorySaver()
_compiled = build_graph().compile(checkpointer=_checkpointer)


# ── Public entry point ────────────────────────────────────────────────────────

async def run_agent(job_url: str, session_id: str) -> GraphState:
    config = {"configurable": {"thread_id": session_id}}
    initial: GraphState = {
        "job_url": job_url,
        "job_description": "",
        "top_skills": [],
        "company_name": "",
        "seniority_level": "",
        "relevant_bullets": [],
        "rewritten_bullets": [],
        "ats_score_before": 0.0,
        "ats_score_after": 0.0,
        "cover_letter": "",
        "error": "",
        "retry_count": 0,
    }
    result: GraphState = await _compiled.ainvoke(initial, config=config)
    return result
