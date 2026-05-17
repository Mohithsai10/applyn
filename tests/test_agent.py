from __future__ import annotations

import pytest

from src.agents.graph import GraphState, build_graph


def test_graph_state_keys() -> None:
    state: GraphState = {
        "job_url": "https://example.com/job",
        "job_description": "Looking for a senior Python developer.",
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
    assert set(state.keys()) == {
        "job_url",
        "job_description",
        "top_skills",
        "company_name",
        "seniority_level",
        "candidate_name",
        "relevant_bullets",
        "rewritten_bullets",
        "ats_score_before",
        "ats_score_after",
        "formatted_resume",
        "cover_letter",
        "interview_questions",
        "error",
        "retry_count",
    }


def test_build_graph_returns_state_graph() -> None:
    from langgraph.graph import StateGraph

    graph = build_graph()
    assert isinstance(graph, StateGraph)


def test_graph_has_all_nodes() -> None:
    graph = build_graph()
    nodes = set(graph.nodes.keys())
    expected = {
        "scrape_job",
        "analyze_jd",
        "retrieve_bullets",
        "rewrite_bullets",
        "score_ats",
        "format_resume",
        "generate_cover",
        "interview_questions",
    }
    assert expected.issubset(nodes)
