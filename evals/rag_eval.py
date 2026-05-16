from __future__ import annotations

from dataclasses import dataclass

from evals.dataset import EvalSample
from src.rag.store import get_client, get_or_create_collection, query_collection


@dataclass
class RAGEvalResult:
    sample_id: str
    retrieved_docs: list[str]
    hit: bool
    recall_at_k: float


def evaluate_retrieval(sample: EvalSample, k: int = 5) -> RAGEvalResult:
    client = get_client()
    collection = get_or_create_collection(client, "resumes")
    results = query_collection(collection, query_texts=[sample.job_description], n_results=k)
    docs = results[0] if results else []
    hits = sum(
        any(kw.lower() in doc.lower() for kw in sample.expected_keywords) for doc in docs
    )
    recall = hits / max(len(sample.expected_keywords), 1)
    return RAGEvalResult(
        sample_id=sample.id,
        retrieved_docs=docs,
        hit=recall > 0,
        recall_at_k=recall,
    )


def run_rag_eval(samples: list[EvalSample], k: int = 5) -> list[RAGEvalResult]:
    return [evaluate_retrieval(s, k=k) for s in samples]
