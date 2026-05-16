from __future__ import annotations

import json
from dataclasses import dataclass

import anthropic

from evals.dataset import EvalSample

_client = anthropic.Anthropic()

JUDGE_PROMPT = """\
You are an expert resume evaluator. Given a tailored resume output and a job description,
score how well the resume matches the role on a scale from 0.0 to 1.0.

Job Description:
{job_description}

Tailored Resume Output:
{tailored_output}

Respond with JSON only: {{"score": <float>, "rationale": "<one sentence>"}}
"""


@dataclass
class LLMEvalResult:
    sample_id: str
    score: float
    rationale: str
    passed: bool


def evaluate_output(sample: EvalSample, tailored_output: str) -> LLMEvalResult:
    prompt = JUDGE_PROMPT.format(
        job_description=sample.job_description,
        tailored_output=tailored_output,
    )
    message = _client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=256,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text
    parsed: dict = json.loads(raw)
    score: float = float(parsed["score"])
    return LLMEvalResult(
        sample_id=sample.id,
        score=score,
        rationale=parsed.get("rationale", ""),
        passed=score >= sample.expected_min_score,
    )


def run_llm_eval(
    samples: list[EvalSample], outputs: list[str]
) -> list[LLMEvalResult]:
    return [evaluate_output(s, o) for s, o in zip(samples, outputs)]
