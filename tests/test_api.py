from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from src.api.main import app

client = TestClient(app)


def test_health_check() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_tailor_not_implemented() -> None:
    no_raise_client = TestClient(app, raise_server_exceptions=False)
    response = no_raise_client.post(
        "/tailor",
        json={
            "resume_text": "My resume",
            "job_description": "Job posting",
        },
    )
    assert response.status_code == 500
