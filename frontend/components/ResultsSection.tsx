"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { AnalyzeResult } from "@/lib/api"

interface Props {
  results: AnalyzeResult
  sessionId: string
  onDownloadResume: () => Promise<void>
  onDownloadCover: () => void
  downloadingResume: boolean
}

function useCountUp(target: number, delay = 0) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const start = performance.now() + delay * 1000
    const duration = 1400
    let raf: number
    function tick(now: number) {
      const elapsed = Math.max(0, now - start)
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 4)
      setDisplay(Math.round(ease * target))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, delay])
  return display
}

function ScoreCard({
  label,
  score,
  delay,
  highlight,
  delta,
}: {
  label: string
  score: number
  delay: number
  highlight: boolean
  delta?: number
}) {
  const pct = Math.round(score * 100)
  const display = useCountUp(pct, delay)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 28, delay }}
      className="card-dark"
      style={{
        flex: 1,
        background: highlight ? "rgba(0,255,135,0.03)" : "#111",
        border: highlight ? "1px solid rgba(0,255,135,0.3)" : "1px solid #1a1a1a",
        boxShadow: highlight ? "0 0 40px rgba(0,255,135,0.1)" : "none",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: highlight ? "#00FF87" : "#555",
          marginBottom: 16,
        }}
      >
        {label}
      </p>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
        <span
          style={{
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: highlight ? "#00FF87" : "#555",
          }}
        >
          {display}
        </span>
        <span
          style={{
            fontSize: 24,
            color: highlight ? "rgba(0,255,135,0.5)" : "rgba(255,255,255,0.15)",
            marginBottom: 6,
          }}
        >
          %
        </span>
        {highlight && delta !== undefined && delta > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 28, delay: delay + 0.6 }}
            style={{
              marginBottom: 6,
              background: "rgba(0,255,135,0.12)",
              color: "#00FF87",
              border: "1px solid rgba(0,255,135,0.3)",
              borderRadius: 999,
              padding: "2px 8px",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            +{delta}%
          </motion.span>
        )}
      </div>
      <div
        style={{
          marginTop: 16,
          height: 3,
          borderRadius: 99,
          background: "#1a1a1a",
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
          style={{
            height: "100%",
            borderRadius: 99,
            background: highlight ? "#00FF87" : "rgba(255,255,255,0.15)",
          }}
        />
      </div>
    </motion.div>
  )
}

function BulletCard({
  original,
  rewritten,
  index,
}: {
  original: string
  rewritten: string
  index: number
}) {
  return (
    <motion.div
      className="card-dark"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 28, delay: index * 0.07 }}
      style={{ padding: 0, overflow: "hidden" }}
    >
      <div
        className="two-col"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderRadius: 16, overflow: "hidden" }}
      >
        <div style={{ padding: 24, borderRight: "1px solid #1a1a1a" }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#555",
              marginBottom: 10,
            }}
          >
            Original
          </p>
          <p style={{ fontSize: 14, color: "#555", fontStyle: "italic", lineHeight: 1.6 }}>
            {original}
          </p>
        </div>
        <div style={{ padding: 24 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#00FF87",
              marginBottom: 10,
            }}
          >
            Rewritten ✓
          </p>
          <p style={{ fontSize: 14, color: "#fff", lineHeight: 1.6 }}>{rewritten}</p>
        </div>
      </div>
    </motion.div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: 22,
        fontWeight: 700,
        color: "#fff",
        letterSpacing: "-0.02em",
        marginBottom: 20,
      }}
    >
      {children}
    </h3>
  )
}

export default function ResultsSection({
  results,
  onDownloadResume,
  onDownloadCover,
  downloadingResume,
}: Props) {
  const [copied, setCopied] = useState(false)

  const deltaPct =
    Math.round(results.ats_score_after * 100) - Math.round(results.ats_score_before * 100)

  const copyLetter = () => {
    navigator.clipboard.writeText(results.cover_letter).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <section className="section" style={{ background: "#080808" }}>
      <div className="container" style={{ display: "flex", flexDirection: "column", gap: 64 }}>

        {/* ── 1. Header ─────────────────────────────────────────── */}
        <div style={{ textAlign: "center" }}>
          <span className="badge">Results</span>
          <h2
            style={{
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#fff",
              marginTop: 16,
              lineHeight: 1.1,
            }}
          >
            Your tailored application
          </h2>
          {results.candidate_name && results.candidate_name !== "Candidate" && (
            <p style={{ color: "#555", fontSize: 18, marginTop: 12 }}>
              for{" "}
              <span style={{ color: "#fff", fontWeight: 600 }}>{results.candidate_name}</span>
              {results.company_name && (
                <>
                  {" "}→{" "}
                  <span style={{ color: "#00FF87", fontWeight: 600 }}>{results.company_name}</span>
                </>
              )}
              {results.seniority_level && (
                <span style={{ color: "#555" }}> · {results.seniority_level}</span>
              )}
            </p>
          )}
          {results.top_skills.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
                marginTop: 20,
              }}
            >
              {results.top_skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid #1a1a1a",
                    color: "#888",
                    fontSize: 12,
                    padding: "5px 14px",
                    borderRadius: 999,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── 2. ATS Scores ─────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 24 }}>
          <ScoreCard
            label="ATS Score Before"
            score={results.ats_score_before}
            delay={0}
            highlight={false}
          />
          <ScoreCard
            label="ATS Score After"
            score={results.ats_score_after}
            delay={0.15}
            highlight
            delta={deltaPct > 0 ? deltaPct : undefined}
          />
        </div>

        {/* ── 3. Rewritten Bullets ──────────────────────────────── */}
        {results.rewritten_bullets.length > 0 && (
          <div>
            <SectionHeading>Rewritten bullets</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {results.rewritten_bullets.map((rb, i) => (
                <BulletCard
                  key={i}
                  original={results.relevant_bullets[i] ?? "—"}
                  rewritten={rb}
                  index={i}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── 4. Cover Letter ───────────────────────────────────── */}
        {results.cover_letter && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <SectionHeading>Cover letter</SectionHeading>
              <motion.button
                onClick={copyLetter}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: copied ? "rgba(0,255,135,0.08)" : "transparent",
                  color: copied ? "#00FF87" : "#555",
                  border: copied ? "1px solid rgba(0,255,135,0.3)" : "1px solid #222",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "8px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                {copied ? "✓ Copied" : "Copy"}
              </motion.button>
            </div>
            <motion.div
              className="card-dark"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28, delay: 0.1 }}
            >
              <p
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: 14,
                  lineHeight: 1.8,
                  color: "#ccc",
                }}
              >
                {results.cover_letter}
              </p>
            </motion.div>
          </div>
        )}

        {/* ── 5. Interview Questions ────────────────────────────── */}
        {results.interview_questions.length > 0 && (
          <div>
            <SectionHeading>Likely interview questions</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {results.interview_questions.map((q, i) => (
                <motion.div
                  key={i}
                  className="card-dark"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 280,
                    damping: 28,
                    delay: i * 0.05,
                  }}
                  style={{ padding: "18px 24px", display: "flex", gap: 16, alignItems: "flex-start" }}
                >
                  <span
                    style={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "rgba(0,255,135,0.06)",
                      border: "1px solid rgba(0,255,135,0.15)",
                      color: "#00FF87",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {i + 1}
                  </span>
                  <p style={{ fontSize: 14, color: "#ccc", lineHeight: 1.6 }}>{q}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── 6. Downloads ──────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 12 }}>
          <motion.button
            onClick={onDownloadResume}
            disabled={downloadingResume}
            whileHover={!downloadingResume ? { scale: 1.01 } : {}}
            whileTap={!downloadingResume ? { scale: 0.97 } : {}}
            style={{
              flex: 1,
              height: 52,
              background: downloadingResume ? "#0d0d0d" : "#00FF87",
              color: downloadingResume ? "#333" : "#000",
              fontWeight: 700,
              fontSize: 15,
              border: "none",
              borderRadius: 10,
              cursor: downloadingResume ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "background 0.2s, color 0.2s",
            }}
          >
            {downloadingResume ? (
              <>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid #333",
                    borderTop: "2px solid #555",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Generating PDF…
              </>
            ) : (
              "↓ Download Resume PDF"
            )}
          </motion.button>

          <motion.button
            onClick={onDownloadCover}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            style={{
              flex: 1,
              height: 52,
              background: "transparent",
              color: "#fff",
              fontWeight: 600,
              fontSize: 15,
              border: "1px solid #222",
              borderRadius: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#00FF87")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#222")}
          >
            ↓ Download Cover Letter
          </motion.button>
        </div>

      </div>
    </section>
  )
}
