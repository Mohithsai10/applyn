"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ProgressSteps, { STEPS } from "@/components/ProgressSteps"
import type { AnalyzeResponse } from "@/app/page"

const API = "http://localhost:8000"
const SPRING = { type: "spring" as const, stiffness: 280, damping: 28 }
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
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pendingResultRef = useRef<AnalyzeResponse | null>(null)

  // Clean up timer on unmount
  useEffect(() => () => { if (stepTimerRef.current) clearInterval(stepTimerRef.current) }, [])

  const fastForwardSteps = useCallback((fromStep: number) => {
    if (stepTimerRef.current) clearInterval(stepTimerRef.current)
    let s = fromStep + 1
    const fast = setInterval(() => {
      setCurrentStep(s)
      s++
      if (s >= STEPS.length) {
        clearInterval(fast)
        // Show results shortly after all steps complete
        setTimeout(() => {
          if (pendingResultRef.current) {
            onResults(pendingResultRef.current)
            setLoadState("idle")
            setCurrentStep(-1)
          }
        }, 600)
      }
    }, 250)
  }, [onResults])

  const handleAnalyze = useCallback(async () => {
    if (!sessionId || !url.trim()) return
    setLoadState("loading")
    setErrorMsg("")
    setCurrentStep(0)
    pendingResultRef.current = null

    // Step simulation: advance every 5 seconds
    let step = 0
    stepTimerRef.current = setInterval(() => {
      step++
      if (step < STEPS.length) {
        setCurrentStep(step)
      } else {
        if (stepTimerRef.current) clearInterval(stepTimerRef.current)
        // If API hasn't returned yet, keep spinner on last step
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

      // Fast-forward remaining steps for snappy UX
      setCurrentStep((cs) => {
        fastForwardSteps(cs)
        return cs
      })
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
    <section>
      <div className="mb-6 flex items-center gap-3">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
          style={{
            background: sessionId ? "rgba(0,232,122,0.12)" : "rgba(255,255,255,0.05)",
            color: sessionId ? "#00E87A" : "#8892A4",
            border: sessionId
              ? "1px solid rgba(0,232,122,0.3)"
              : "1px solid rgba(255,255,255,0.1)",
          }}
        >
          2
        </span>
        <h2
          className="text-lg font-semibold tracking-tight"
          style={{ color: "#F0F4FF", letterSpacing: "-0.02em" }}
        >
          Paste a job URL
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {/* Input */}
        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => e.key === "Enter" && canAnalyze && handleAnalyze()}
            placeholder="LinkedIn, Indeed, Greenhouse, Workday…"
            disabled={isLoading}
            className="w-full rounded-2xl px-5 py-4 text-base outline-none transition-all duration-200 disabled:opacity-50"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: focused
                ? "1px solid rgba(0,232,122,0.5)"
                : "1px solid rgba(255,255,255,0.08)",
              color: "#F0F4FF",
              fontFamily: "var(--font-sans)",
              boxShadow: focused
                ? "0 0 0 3px rgba(0,232,122,0.08), 0 0 20px rgba(0,232,122,0.1)"
                : "none",
              caretColor: "#00E87A",
            }}
          />
        </div>

        {/* Analyze button */}
        <div className="relative group">
          <motion.button
            type="button"
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            className="btn-primary shimmer-btn w-full rounded-2xl py-4 text-base relative overflow-hidden"
            whileTap={canAnalyze ? { scale: 0.98 } : {}}
            title={!sessionId ? "Upload your resume first" : undefined}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="h-4 w-4 rounded-full border-2 animate-spin-step inline-block"
                  style={{
                    borderColor: "rgba(10,15,30,0.4)",
                    borderTopColor: "#0A0F1E",
                  }}
                />
                Analyzing…
              </span>
            ) : (
              "Analyze & Tailor →"
            )}
          </motion.button>

          {/* Tooltip when no session */}
          {!sessionId && (
            <div
              className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "#8892A4",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              Upload your resume first
            </div>
          )}
        </div>

        {/* Error */}
        <AnimatePresence>
          {loadState === "error" && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-center"
              style={{ color: "rgba(255,100,100,0.9)" }}
            >
              {errorMsg}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Progress steps */}
        <AnimatePresence>
          {isLoading && currentStep >= 0 && (
            <ProgressSteps currentStep={currentStep} />
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
