from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class ApplicationMetrics:
    session_id: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    match_score: float = 0.0
    bullets_rewritten: int = 0
    tokens_used: int = 0
    latency_ms: float = 0.0
    model: str = ""

    def to_dict(self) -> dict[str, object]:
        return {
            "session_id": self.session_id,
            "created_at": self.created_at.isoformat(),
            "match_score": self.match_score,
            "bullets_rewritten": self.bullets_rewritten,
            "tokens_used": self.tokens_used,
            "latency_ms": self.latency_ms,
            "model": self.model,
        }


def log_metric(metrics: ApplicationMetrics, sink: list[dict] | None = None) -> dict[str, object]:
    record = metrics.to_dict()
    if sink is not None:
        sink.append(record)
    return record
