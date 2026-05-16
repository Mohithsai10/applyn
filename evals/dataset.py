from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class EvalSample:
    id: str
    resume_text: str
    job_description: str
    expected_keywords: list[str] = field(default_factory=list)
    expected_min_score: float = 0.7


def load_dataset(path: Path) -> list[EvalSample]:
    with path.open() as f:
        records = json.load(f)
    return [EvalSample(**r) for r in records]


def save_dataset(samples: list[EvalSample], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    records = [
        {
            "id": s.id,
            "resume_text": s.resume_text,
            "job_description": s.job_description,
            "expected_keywords": s.expected_keywords,
            "expected_min_score": s.expected_min_score,
        }
        for s in samples
    ]
    with path.open("w") as f:
        json.dump(records, f, indent=2)
