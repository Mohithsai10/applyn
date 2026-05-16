from __future__ import annotations

from typing import Annotated, TypedDict

from langgraph.graph import END, StateGraph


class GraphState(TypedDict):
    resume_text: str
    job_description: str
    tailored_bullets: list[str]
    cover_letter: str
    match_score: float
    feedback: str
    messages: Annotated[list[str], "append"]


def build_graph() -> StateGraph:
    graph = StateGraph(GraphState)
    # Nodes will be added here
    return graph


graph = build_graph()
