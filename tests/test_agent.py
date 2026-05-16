from __future__ import annotations

import pytest

from src.agents.graph import GraphState, build_graph


def test_graph_state_keys() -> None:
    state: GraphState = {
        "resume_text": "Software engineer with 5 years experience.",
        "job_description": "Looking for a senior Python developer.",
        "tailored_bullets": [],
        "cover_letter": "",
        "match_score": 0.0,
        "feedback": "",
        "messages": [],
    }
    assert set(state.keys()) == {
        "resume_text",
        "job_description",
        "tailored_bullets",
        "cover_letter",
        "match_score",
        "feedback",
        "messages",
    }


def test_build_graph_returns_state_graph() -> None:
    from langgraph.graph import StateGraph

    graph = build_graph()
    assert isinstance(graph, StateGraph)
