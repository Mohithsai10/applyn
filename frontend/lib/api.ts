const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface AnalyzeResult {
  job_url: string
  job_description: string
  top_skills: string[]
  company_name: string
  seniority_level: string
  candidate_name: string
  relevant_bullets: string[]
  rewritten_bullets: string[]
  ats_score_before: number
  ats_score_after: number
  formatted_resume: string
  cover_letter: string
  interview_questions: string[]
  error: string
  retry_count: number
}

export async function checkBackend(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(3000),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function uploadResume(
  file: File
): Promise<{ chunks_stored: number; session_id: string }> {
  const form = new FormData()
  form.append("file", file)
  const res = await fetch(`${API_BASE}/upload-resume`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Upload failed" }))
    throw new Error(body.detail ?? "Upload failed")
  }
  return res.json()
}

export async function analyzeJob(
  job_url: string,
  session_id: string,
  onSlowWarning?: () => void
): Promise<AnalyzeResult> {
  const slowTimer = onSlowWarning ? setTimeout(onSlowWarning, 20000) : null
  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_url, session_id }),
      signal: AbortSignal.timeout(120000),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: "Analysis failed" }))
      throw new Error(body.detail ?? "Analysis failed")
    }
    return res.json()
  } finally {
    if (slowTimer !== null) clearTimeout(slowTimer)
  }
}

export async function downloadResume(
  session_id: string
): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`${API_BASE}/download/resume/${session_id}`, {
    method: "POST",
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Download failed" }))
    throw new Error(body.detail ?? "Download failed")
  }
  const disposition = res.headers.get("Content-Disposition") ?? ""
  const match = disposition.match(/filename="(.+)"/)
  const filename = match?.[1] ?? "resume.pdf"
  const blob = await res.blob()
  return { blob, filename }
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function saveCoverLetter(coverLetter: string, companyName: string): void {
  const safe = companyName.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") || "Company"
  triggerDownload(
    new Blob([coverLetter], { type: "text/plain" }),
    `Cover_Letter_${safe}.txt`
  )
}
