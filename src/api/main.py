from __future__ import annotations

import io
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
from fastapi.responses import JSONResponse, StreamingResponse
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


# ── Helpers ───────────────────────────────────────────────────────────────────

def _is_valid_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception:
        return False


_ALLOWED_SUFFIXES = {".pdf", ".docx"}


def _build_resume_pdf(formatted_resume: str) -> bytes:
    """Render the plain-text formatted resume into a letter-size PDF."""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=0.5 * inch,
        rightMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    name_style = ParagraphStyle(
        "Name", fontName="Helvetica-Bold", fontSize=16, spaceAfter=4
    )
    contact_style = ParagraphStyle(
        "Contact", fontName="Helvetica", fontSize=10, spaceAfter=6
    )
    section_style = ParagraphStyle(
        "Section", fontName="Helvetica-Bold", fontSize=11, spaceBefore=10, spaceAfter=3
    )
    body_style = ParagraphStyle(
        "Body", fontName="Helvetica", fontSize=10, spaceAfter=2, leading=14
    )
    bullet_style = ParagraphStyle(
        "Bullet", fontName="Helvetica", fontSize=10, leftIndent=14, spaceAfter=2, leading=14
    )

    story = []
    first_line = True
    second_line = False

    for raw_line in formatted_resume.strip().splitlines():
        stripped = raw_line.strip()

        if not stripped:
            story.append(Spacer(1, 3))
            continue

        if first_line:
            story.append(Paragraph(_rl_escape(stripped), name_style))
            first_line = False
            second_line = True
            continue

        if second_line:
            story.append(Paragraph(_rl_escape(stripped), contact_style))
            second_line = False
            continue

        # Section headers are ALL CAPS (isupper() ignores non-alpha chars)
        if stripped.isupper():
            story.append(
                HRFlowable(
                    width="100%",
                    thickness=0.5,
                    color=colors.HexColor("#333333"),
                    spaceAfter=3,
                )
            )
            story.append(Paragraph(_rl_escape(stripped), section_style))
            continue

        # Bullet points
        if stripped.startswith(("-", "•")):
            text = stripped.lstrip("-•").strip()
            story.append(Paragraph(f"• {_rl_escape(text)}", bullet_style))
            continue

        story.append(Paragraph(_rl_escape(stripped), body_style))

    doc.build(story)
    buf.seek(0)
    return buf.read()


def _rl_escape(text: str) -> str:
    """Escape characters that ReportLab's Paragraph XML parser would misinterpret."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


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


@app.post("/download/resume/{session_id}")
async def download_resume(session_id: str, request: Request) -> StreamingResponse:
    from src.agents.graph import get_state_for_session

    state = get_state_for_session(session_id)
    if not state:
        raise HTTPException(
            status_code=404,
            detail="Session not found. Run /analyze first.",
        )

    formatted_resume = state.get("formatted_resume", "")
    if not formatted_resume:
        raise HTTPException(
            status_code=404,
            detail="No formatted resume for this session. Run /analyze first.",
        )

    candidate_name = state.get("candidate_name") or "Candidate"
    company_name = state.get("company_name") or "Company"

    safe_name = re.sub(r"[^\w\s-]", "", candidate_name).strip().replace(" ", "_")
    safe_company = re.sub(r"[^\w\s-]", "", company_name).strip().replace(" ", "_")
    filename = f"{safe_name}_{safe_company}_Resume.pdf"

    try:
        pdf_bytes = _build_resume_pdf(formatted_resume)
    except Exception as exc:
        log.exception("PDF generation failed for session %s", session_id)
        raise HTTPException(
            status_code=500,
            detail=f"PDF generation failed: {type(exc).__name__}: {exc}",
        )

    log.info("Generated resume PDF (%d bytes) for session %s", len(pdf_bytes), session_id)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
