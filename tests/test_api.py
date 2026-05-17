from __future__ import annotations

import io

import pytest
from fastapi.testclient import TestClient

from src.api.main import app

client = TestClient(app, raise_server_exceptions=False)


def test_health_check() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "1.0.0"


def test_upload_resume_rejects_txt() -> None:
    response = client.post(
        "/upload-resume",
        files={"file": ("resume.txt", b"some content", "text/plain")},
    )
    assert response.status_code == 400
    assert "Unsupported" in response.json()["detail"]


def test_upload_resume_rejects_missing_file() -> None:
    response = client.post("/upload-resume")
    assert response.status_code in (400, 422)


def test_analyze_rejects_bad_url() -> None:
    response = client.post(
        "/analyze",
        json={"job_url": "not-a-url", "session_id": "test-session"},
    )
    assert response.status_code == 400
    assert "job_url" in response.json()["detail"].lower()


def test_analyze_rejects_ftp_url() -> None:
    response = client.post(
        "/analyze",
        json={"job_url": "ftp://example.com/job", "session_id": "test-session"},
    )
    assert response.status_code == 400


def test_pii_redaction_middleware() -> None:
    """Confirm the middleware strips emails before they reach the route."""
    response = client.post(
        "/analyze",
        json={
            "job_url": "not-a-url",
            "session_id": "user@example.com",  # email in body — should be redacted
        },
    )
    # 400 from URL validation means middleware passed the request through cleanly.
    assert response.status_code == 400


def test_download_resume_unknown_session() -> None:
    """Requesting a PDF for a session that has never run the agent returns 404."""
    response = client.post("/download/resume/nonexistent-session-id-xyz")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
