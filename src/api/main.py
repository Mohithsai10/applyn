from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Applyn API", version="0.1.0", description="AI job application agent API")


class TailorRequest(BaseModel):
    resume_text: str
    job_description: str


class TailorResponse(BaseModel):
    tailored_bullets: list[str]
    cover_letter: str
    match_score: float


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/tailor", response_model=TailorResponse)
async def tailor_resume(request: TailorRequest) -> TailorResponse:
    # Agent invocation will be wired here
    raise NotImplementedError
