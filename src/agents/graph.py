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
from urllib.parse import parse_qs, urlparse
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel
from tavily import TavilyClient

from src.rag.store import retrieve_bullets as rag_retrieve_bullets
from src.rag.store import retrieve_candidate_name as rag_retrieve_candidate_name

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
    candidate_name: str
    relevant_bullets: list[str]
    rewritten_bullets: list[str]
    ats_score_before: float
    ats_score_after: float
    formatted_resume: str
    cover_letter: str
    interview_questions: list[str]
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


def _clean_resume_text(text: str) -> str:
    text = re.sub(r"\*{1,3}", "", text)
    text = re.sub(r"#{1,6}\s?", "", text)
    text = re.sub(r"_{1,3}", "", text)
    text = re.sub(r"`{1,3}", "", text)
    text = re.sub(r"~{1,2}", "", text)
    text = re.sub(r"^[-=]{3,}\s*$", "", text, flags=re.MULTILINE)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _keyword_overlap(bullets: list[str], skills: list[str]) -> float:
    if not skills:
        return 0.0
    combined = " ".join(bullets).lower()
    hits = sum(1 for s in skills if s.lower() in combined)
    return round(hits / len(skills), 4)


# ── Nodes ─────────────────────────────────────────────────────────────────────

_BLOCK_MARKERS = (
    "page not found",
    "authwall",
    "join linkedin",
    "sign in to linkedin",
    "sign in to view",
    "please sign in",
    "access denied",
    "please enable javascript",
    "enable javascript to continue",
    "robot or human",
    "are you a robot",
)


def _is_blocked(text: str) -> bool:
    low = text.lower()
    return len(text) < 200 or any(m in low for m in _BLOCK_MARKERS)


def _build_tavily_query(url: str) -> str:
    """Build the most targeted Tavily query possible from the job URL."""
    parsed = urlparse(url)
    host = parsed.netloc.lower()

    if "indeed.com" in host:
        jk = (parse_qs(parsed.query).get("jk") or [""])[0]
        if jk:
            return f"indeed job {jk} description requirements qualifications responsibilities"
        return f"indeed job description requirements {url}"

    if "linkedin.com" in host:
        match = re.search(r"/jobs/view/(\d+)", parsed.path)
        job_id = match.group(1) if match else ""
        if job_id:
            return f"linkedin job {job_id} description requirements responsibilities"
        return f"site:linkedin.com/jobs {url} job description requirements"

    # Generic fallback — works for Greenhouse, Lever, Workday, etc.
    return f"job description requirements qualifications responsibilities {url}"


def _tavily_fallback(url: str) -> str:
    tavily = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])
    query = _build_tavily_query(url)
    results = tavily.search(query, max_results=5)
    hits = results.get("results") or []
    return " ".join(r.get("content", "") for r in hits).strip()


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
                if text and not _is_blocked(text):
                    return {"job_description": text, "error": ""}

            text = await _playwright_fetch(url)
            if text and not _is_blocked(text):
                return {"job_description": text, "error": ""}
        except Exception:
            pass

    # Direct scraping blocked for all attempts — try Tavily for any site
    try:
        text = _tavily_fallback(url)
        if text and len(text) >= 200:
            return {"job_description": text, "error": ""}
    except Exception:
        pass

    return {
        "job_description": "",
        "error": (
            "Could not retrieve job description. "
            "Please try copying the job text manually."
        ),
    }


async def analyze_jd(state: GraphState) -> dict:
    jd = (state.get("job_description") or "").strip()
    if len(jd) < 50:
        return {"error": "Job description is empty. Scraping was blocked."}

    raw = (_PROMPTS / "analyze_jd.txt").read_text()
    instructions = raw.split("---\nJOB DESCRIPTION:")[0].strip()
    structured_llm = _llm.with_structured_output(JobAnalysis)
    result: JobAnalysis = await structured_llm.ainvoke(
        [
            SystemMessage(content=instructions),
            HumanMessage(content=jd),
        ]
    )
    top_skills = [s for s in (result.top_5_skills or []) if s and s != "<UNKNOWN>"]
    if not top_skills:
        return {"error": "Could not extract skills from job description"}
    return {
        "top_skills": top_skills,
        "company_name": result.company_name or "",
        "seniority_level": result.seniority_level or "",
    }


async def retrieve_bullets_node(state: GraphState) -> dict:
    bullets = rag_retrieve_bullets(state["top_skills"])
    candidate_name = rag_retrieve_candidate_name()
    return {"relevant_bullets": bullets, "candidate_name": candidate_name}


async def rewrite_bullets(state: GraphState) -> dict:
    if not state.get("relevant_bullets"):
        return {"error": "No resume bullets found. Please re-upload your resume."}

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


async def format_resume(state: GraphState) -> dict:
    template = (_PROMPTS / "resume_format.txt").read_text()

    candidate_name = state.get("candidate_name") or "Candidate"
    skills = state.get("top_skills", [])
    job_title = (
        f"{state.get('seniority_level', '')} {skills[0] if skills else ''}".strip()
        or "Software Engineer"
    )
    company_name = state.get("company_name") or "the company"

    # Use str.replace so only the three known input placeholders are substituted;
    # the remaining {location}, {phone}, … in the OUTPUT section stay literal for Claude.
    system_prompt = (
        template
        .replace("{candidate_name}", candidate_name)
        .replace("{job_title}", job_title)
        .replace("{company_name}", company_name)
    )

    bullets_block = "\n".join(f"- {b}" for b in state.get("rewritten_bullets", []))
    skills_block = ", ".join(skills)
    original_block = "\n".join(state.get("relevant_bullets", []))

    human_content = (
        f"JOB DESCRIPTION:\n{state['job_description'][:3_000]}\n\n"
        f"REQUIRED SKILLS:\n{skills_block}\n\n"
        f"ORIGINAL RESUME BULLETS:\n{original_block}\n\n"
        f"AI-REWRITTEN BULLETS (use these):\n{bullets_block}"
    )

    response = await _llm.ainvoke(
        [SystemMessage(content=system_prompt), HumanMessage(content=human_content)]
    )
    return {"formatted_resume": _clean_resume_text(response.content)}


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


async def gen_interview_questions(state: GraphState) -> dict:
    bullets_block = "\n".join(f"- {b}" for b in state.get("rewritten_bullets", []))
    prompt = (
        "Based on this job description and the candidate's rewritten resume, "
        "generate exactly 10 likely interview questions the hiring manager will ask. "
        "Mix behavioral (STAR format), technical, and situational questions. "
        "Return ONLY a JSON array of 10 strings, no other text.\n\n"
        f"JOB DESCRIPTION:\n{state['job_description'][:2_000]}\n\n"
        f"REWRITTEN RESUME BULLETS:\n{bullets_block}"
    )
    response = await _llm.ainvoke([HumanMessage(content=prompt)])
    text = response.content.strip()
    # Extract JSON array from anywhere in the response
    for pattern in (r"\[.*\]", r"\[.*?\]"):
        match = re.search(pattern, text, re.DOTALL)
        if match:
            try:
                questions = json.loads(match.group())
                if isinstance(questions, list):
                    return {"interview_questions": [str(q) for q in questions[:10]]}
            except (json.JSONDecodeError, ValueError):
                continue
    # Last resort: try parsing the whole response
    try:
        questions = json.loads(text)
        if isinstance(questions, list):
            return {"interview_questions": [str(q) for q in questions[:10]]}
    except (json.JSONDecodeError, ValueError):
        pass
    return {"interview_questions": []}


# ── Routing ───────────────────────────────────────────────────────────────────

def _route_after_score(
    state: GraphState,
) -> Literal["rewrite_bullets", "format_resume"]:
    if state["ats_score_after"] < 0.70 and state.get("retry_count", 0) < 2:
        return "rewrite_bullets"
    return "format_resume"


# ── Graph construction ────────────────────────────────────────────────────────

def build_graph() -> StateGraph:
    builder = StateGraph(GraphState)

    builder.add_node("scrape_job", scrape_job)
    builder.add_node("analyze_jd", analyze_jd)
    builder.add_node("retrieve_bullets", retrieve_bullets_node)
    builder.add_node("rewrite_bullets", rewrite_bullets)
    builder.add_node("score_ats", score_ats)
    builder.add_node("format_resume", format_resume)
    builder.add_node("generate_cover", generate_cover)
    builder.add_node("interview_questions", gen_interview_questions)

    builder.add_edge(START, "scrape_job")
    builder.add_edge("scrape_job", "analyze_jd")
    builder.add_edge("analyze_jd", "retrieve_bullets")
    builder.add_edge("retrieve_bullets", "rewrite_bullets")
    builder.add_edge("rewrite_bullets", "score_ats")
    builder.add_conditional_edges("score_ats", _route_after_score)
    builder.add_edge("format_resume", "generate_cover")
    builder.add_edge("generate_cover", "interview_questions")
    builder.add_edge("interview_questions", END)

    return builder


_checkpointer = MemorySaver()
_compiled = build_graph().compile(checkpointer=_checkpointer)


# ── Public entry points ───────────────────────────────────────────────────────

async def run_agent(job_url: str, session_id: str) -> GraphState:
    config = {"configurable": {"thread_id": session_id}}
    initial: GraphState = {
        "job_url": job_url,
        "job_description": "",
        "top_skills": [],
        "company_name": "",
        "seniority_level": "",
        "candidate_name": "",
        "relevant_bullets": [],
        "rewritten_bullets": [],
        "ats_score_before": 0.0,
        "ats_score_after": 0.0,
        "formatted_resume": "",
        "cover_letter": "",
        "interview_questions": [],
        "error": "",
        "retry_count": 0,
    }
    result: GraphState = await _compiled.ainvoke(initial, config=config)
    return result


def get_state_for_session(session_id: str) -> GraphState | None:
    """Retrieve persisted state from the MemorySaver checkpointer."""
    config = {"configurable": {"thread_id": session_id}}
    snapshot = _compiled.get_state(config)
    if snapshot and snapshot.values:
        return snapshot.values  # type: ignore[return-value]
    return None
