"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ProgressSteps from "@/components/ProgressSteps"

interface Props {
  onAnalyze: (url: string) => Promise<void>
  analyzing: boolean
  disabled: boolean
  slowWarning: boolean
  analyzeError: string | null
  currentStep: number
}

export default function JobInput({
  onAnalyze,
  analyzing,
  disabled,
  slowWarning,
  analyzeError,
  currentStep,
}: Props) {
  const [url, setUrl] = useState("")
  const [focused, setFocused] = useState(false)

  const canAnalyze = !disabled && !analyzing && url.trim().length > 0

  const handleSubmit = () => {
    if (canAnalyze) onAnalyze(url.trim())
  }

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
          {/* Left — input card */}
          <div>
            <div
              className="card-dark"
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <span className="badge" style={{ alignSelf: "flex-start" }}>Step 02</span>

              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="https://linkedin.com/jobs/view/…"
                disabled={analyzing}
                style={{
                  width: "100%",
                  height: 56,
                  background: "#0d0d0d",
                  border: focused ? "1px solid #00FF87" : "1px solid #1a1a1a",
                  boxShadow: focused ? "0 0 0 3px rgba(0,255,135,0.1)" : "none",
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
                onClick={handleSubmit}
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
                {analyzing ? (
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

              {disabled && !analyzing && (
                <p style={{ color: "#333", fontSize: 13, textAlign: "center" }}>
                  Upload your resume above first
                </p>
              )}

              <AnimatePresence>
                {slowWarning && analyzing && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ color: "#555", fontSize: 13, textAlign: "center" }}
                  >
                    Still running — LLM pipelines can take up to 2 minutes…
                  </motion.p>
                )}
                {analyzeError && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ color: "rgba(255,77,77,0.9)", fontSize: 13, textAlign: "center" }}
                  >
                    {analyzeError}
                  </motion.p>
                )}
              </AnimatePresence>

              <p style={{ color: "#333", fontSize: 12, textAlign: "center" }}>
                Powered by Claude · LangGraph · ChromaDB
              </p>
            </div>

            <AnimatePresence>
              {analyzing && currentStep >= 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ marginTop: 16 }}
                >
                  <ProgressSteps currentStep={currentStep} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — text */}
          <div style={{ maxWidth: 420 }}>
            <h2
              style={{
                fontSize: "clamp(32px, 4vw, 48px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#fff",
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
