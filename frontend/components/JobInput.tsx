"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ProgressSteps, { STEPS } from "@/components/ProgressSteps"
import type { AnalyzeResponse } from "@/app/page"

const API = "http://localhost:8000"
const STEP_INTERVAL_MS = 5000

interface Props {
  sessionId: string | null
  onResults: (results: AnalyzeResponse) => void
}

type LoadState = "idle" | "loading" | "error"

export default function JobInput({ sessionId, onResults }: Props) {
  const [url, setUrl] = useState("")
  const [focused, setFocused] = useState(false)
  const [loadState, setLoadState] = useState<LoadState>("idle")
  const [currentStep, setCurrentStep] = useState(-1)
  const [errorMsg, setErrorMsg] = useState("")
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pendingResultRef = useRef<AnalyzeResponse | null>(null)

  useEffect(() => () => { if (stepTimerRef.current) clearInterval(stepTimerRef.current) }, [])

  const fastForwardSteps = useCallback(
    (fromStep: number) => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current)
      let s = fromStep + 1
      const fast = setInterval(() => {
        setCurrentStep(s)
        s++
        if (s >= STEPS.length) {
          clearInterval(fast)
          setTimeout(() => {
            if (pendingResultRef.current) {
              onResults(pendingResultRef.current)
              setLoadState("idle")
              setCurrentStep(-1)
            }
          }, 600)
        }
      }, 250)
    },
    [onResults]
  )

  const handleAnalyze = useCallback(async () => {
    if (!sessionId || !url.trim()) return
    setLoadState("loading")
    setErrorMsg("")
    setCurrentStep(0)
    pendingResultRef.current = null

    let step = 0
    stepTimerRef.current = setInterval(() => {
      step++
      if (step < STEPS.length) {
        setCurrentStep(step)
      } else {
        if (stepTimerRef.current) clearInterval(stepTimerRef.current)
        setCurrentStep(STEPS.length - 1)
      }
    }, STEP_INTERVAL_MS)

    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_url: url.trim(), session_id: sessionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? "Analysis failed")
      pendingResultRef.current = data
      setCurrentStep((cs) => { fastForwardSteps(cs); return cs })
    } catch (err: unknown) {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current)
      setLoadState("error")
      setCurrentStep(-1)
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong")
    }
  }, [sessionId, url, fastForwardSteps])

  const isLoading = loadState === "loading"
  const canAnalyze = !!sessionId && url.trim().length > 0 && !isLoading

  return (
    <section id="analyze" className="section" style={{ background: "#080808" }}>
      <div className="container">
        <div
          className="two-col"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 80,
            alignItems: "start",
          }}
        >
          {/* Left — card with input + button */}
          <div>
            <div className="card-dark" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => e.key === "Enter" && canAnalyze && handleAnalyze()}
                placeholder="https://linkedin.com/jobs/view/…"
                disabled={isLoading}
                style={{
                  width: "100%",
                  height: 56,
                  background: "#0d0d0d",
                  border: focused
                    ? "1px solid #00FF87"
                    : "1px solid #1a1a1a",
                  boxShadow: focused
                    ? "0 0 0 3px rgba(0,255,135,0.1)"
                    : "none",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 15,
                  padding: "0 16px",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              />

              <motion.button
                type="button"
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                whileTap={canAnalyze ? { scale: 0.97 } : {}}
                style={{
                  width: "100%",
                  height: 56,
                  background: canAnalyze ? "#00FF87" : "#1a1a1a",
                  color: canAnalyze ? "#000" : "#333",
                  fontWeight: 700,
                  fontSize: 16,
                  border: "none",
                  borderRadius: 10,
                  cursor: canAnalyze ? "pointer" : "not-allowed",
                  transition: "background 0.2s, color 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {isLoading ? (
                  <>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(0,0,0,0.2)",
                        borderTop: "2px solid #000",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    Analyzing…
                  </>
                ) : (
                  "Analyze & Tailor →"
                )}
              </motion.button>

              {!sessionId && (
                <p style={{ color: "#333", fontSize: 13, textAlign: "center" }}>
                  Upload your resume above first
                </p>
              )}

              <AnimatePresence>
                {loadState === "error" && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ color: "rgba(255,77,77,0.9)", fontSize: 13, textAlign: "center" }}
                  >
                    {errorMsg}
                  </motion.p>
                )}
              </AnimatePresence>

              <p style={{ color: "#333", fontSize: 12, textAlign: "center" }}>
                Powered by Claude · LangGraph · ChromaDB
              </p>
            </div>

            <AnimatePresence>
              {isLoading && currentStep >= 0 && (
                <motion.div style={{ marginTop: 16 }}>
                  <ProgressSteps currentStep={currentStep} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — text */}
          <div>
            <span className="badge">Step 02</span>
            <h2
              style={{
                fontSize: "clamp(32px, 4vw, 48px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#fff",
                marginTop: 24,
                lineHeight: 1.1,
              }}
            >
              Paste a job URL
            </h2>
            <p style={{ color: "#555", fontSize: 18, marginTop: 16, lineHeight: 1.65 }}>
              Any job board — LinkedIn, Indeed, Greenhouse, Workday. Applyn
              scrapes the full description and runs the AI pipeline in under a
              minute.
            </p>
            <div
              style={{
                marginTop: 32,
                padding: "20px 24px",
                background: "#111",
                border: "1px solid #1a1a1a",
                borderRadius: 12,
              }}
            >
              <p style={{ color: "#00FF87", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em" }}>
                WHAT HAPPENS NEXT
              </p>
              <p style={{ color: "#555", fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
                A LangGraph agent scrapes the posting, extracts the top skills,
                retrieves your best matching bullets, rewrites them with Claude,
                and generates a tailored cover letter.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
