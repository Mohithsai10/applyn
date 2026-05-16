from __future__ import annotations

import logging
import os
import re
import tempfile
import uuid
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.types import ASGIApp, Receive, Scope, Send

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
log = logging.getLogger("applyn.api")

# ── Rate limiter ──────────────────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address)

# ── App + exception handlers ──────────────────────────────────────────────────

app = FastAPI(title="Applyn API", version="1.0.0", description="AI job application agent API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(RequestValidationError)
async def _validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": exc.errors()})


# ── Middleware ────────────────────────────────────────────────────────────────
# Registration order: first added = innermost (last to touch the request).
# Execution order for an inbound request: logging → PII → CORS → route.

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
_PHONE_RE = re.compile(r"(\+?1[\s\-\.]?)?\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4}")


class PIIRedactionMiddleware:
    """Pure-ASGI middleware that strips emails and phone numbers from JSON/text bodies."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = {k: v for k, v in scope.get("headers", [])}
        content_type = headers.get(b"content-type", b"").decode("utf-8", errors="ignore")

        if "json" not in content_type and "text" not in content_type:
            await self.app(scope, receive, send)
            return

        # Buffer the full request body, then redact PII.
        chunks: list[bytes] = []
        more_body = True
        while more_body:
            msg = await receive()
            chunks.append(msg.get("body", b""))
            more_body = msg.get("more_body", False)

        body = b"".join(chunks)
        try:
            text = body.decode("utf-8")
            text = _EMAIL_RE.sub("[REDACTED_EMAIL]", text)
            text = _PHONE_RE.sub("[REDACTED_PHONE]", text)
            body = text.encode("utf-8")
        except UnicodeDecodeError:
            pass

        async def _redacted_receive() -> dict:
            return {"type": "http.request", "body": body, "more_body": False}

        await self.app(scope, _redacted_receive, send)


app.add_middleware(PIIRedactionMiddleware)


@app.middleware("http")
async def _log_requests(request: Request, call_next):
    client = request.client.host if request.client else "unknown"
    log.info("→ %s %s [%s]", request.method, request.url.path, client)
    response = await call_next(request)
    log.info("← %s %s %d [%s]", request.method, request.url.path, response.status_code, client)
    return response


# ── Pydantic models ───────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    version: str


class UploadResumeResponse(BaseModel):
    success: bool
    chunks_stored: int
    session_id: str


class AnalyzeRequest(BaseModel):
    job_url: str
    session_id: str


class AnalyzeResponse(BaseModel):
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


# ── Helpers ───────────────────────────────────────────────────────────────────

def _is_valid_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception:
        return False


_ALLOWED_SUFFIXES = {".pdf", ".docx"}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health_check(request: Request) -> HealthResponse:
    return HealthResponse(status="ok", version="1.0.0")


@app.post("/upload-resume", response_model=UploadResumeResponse)
@limiter.limit("10/minute")
async def upload_resume(request: Request, file: UploadFile) -> UploadResumeResponse:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in _ALLOWED_SUFFIXES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Only .pdf and .docx are accepted.",
        )

    # Lazy import avoids circular dependency at module load.
    from src.rag.store import embed_resume

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        result = embed_resume(tmp_path)
    except Exception as exc:
        log.exception("embed_resume failed for %s", file.filename)
        raise HTTPException(
            status_code=500,
            detail=f"Resume processing failed: {type(exc).__name__}: {exc}",
        )
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    session_id = str(uuid.uuid4())
    log.info(
        "Embedded %d chunks from '%s' — session_id=%s",
        result["chunks_stored"],
        file.filename,
        session_id,
    )
    return UploadResumeResponse(
        success=True,
        chunks_stored=int(result["chunks_stored"]),
        session_id=session_id,
    )


@app.post("/analyze", response_model=AnalyzeResponse)
@limiter.limit("10/minute")
async def analyze(request: Request, body: AnalyzeRequest) -> AnalyzeResponse:
    if not _is_valid_url(body.job_url):
        raise HTTPException(
            status_code=400,
            detail="job_url must be a valid HTTP or HTTPS URL.",
        )

    from src.agents.graph import run_agent

    try:
        state = await run_agent(job_url=body.job_url, session_id=body.session_id)
    except Exception as exc:
        log.exception("run_agent failed: url=%s session=%s", body.job_url, body.session_id)
        raise HTTPException(
            status_code=500,
            detail=f"Agent error: {type(exc).__name__}: {exc}",
        )

    if state.get("error"):
        raise HTTPException(status_code=500, detail=state["error"])

    return AnalyzeResponse(**state)
