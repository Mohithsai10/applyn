"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, animate } from "framer-motion"
import type { AnalyzeResponse } from "@/app/page"

const SPRING = { type: "spring" as const, stiffness: 280, damping: 28 }

interface Props {
  results: AnalyzeResponse
}

function useAnimatedNumber(target: number, delay = 0) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const controls = animate(0, target, {
      duration: 1.4,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
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
  const displayPct = useAnimatedNumber(pct, delay)

  return (
    <motion.div
      className="flex-1 rounded-2xl p-6 flex flex-col gap-3"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay }}
      style={{
        background: highlight ? "rgba(0,232,122,0.05)" : "rgba(255,255,255,0.03)",
        border: highlight
          ? "1px solid rgba(0,232,122,0.3)"
          : "1px solid rgba(255,255,255,0.07)",
        boxShadow: highlight ? "0 0 30px rgba(0,232,122,0.1)" : "none",
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: highlight ? "#00E87A" : "#8892A4" }}
      >
        {label}
      </p>

      <div className="flex items-end gap-3">
        <span
          className="text-5xl font-bold leading-none tabular-nums"
          style={{
            color: highlight ? "#00E87A" : "#8892A4",
            letterSpacing: "-0.04em",
          }}
        >
          {displayPct}
        </span>
        <span
          className="text-xl mb-1"
          style={{ color: highlight ? "rgba(0,232,122,0.6)" : "rgba(255,255,255,0.2)" }}
        >
          %
        </span>

        {highlight && delta !== undefined && delta > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...SPRING, delay: delay + 0.6 }}
            className="mb-1 rounded-full px-2 py-0.5 text-xs font-bold"
            style={{
              background: "rgba(0,232,122,0.15)",
              color: "#00E87A",
              border: "1px solid rgba(0,232,122,0.3)",
            }}
          >
            +{delta}%
          </motion.span>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="h-1 w-full rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: highlight
              ? "linear-gradient(90deg, #00E87A, #00B8D4)"
              : "rgba(255,255,255,0.15)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
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
      className="glass rounded-2xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0.05 * index }}
    >
      <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
        {/* Original */}
        <div className="p-5 flex flex-col gap-2">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#8892A4" }}
          >
            Original
          </span>
          <p
            className="text-sm leading-relaxed italic"
            style={{ color: "#8892A4" }}
          >
            {original}
          </p>
        </div>

        {/* Rewritten */}
        <div className="p-5 flex flex-col gap-2">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#00E87A" }}
          >
            Rewritten ✓
          </span>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "#F0F4FF" }}
          >
            {rewritten}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function DownloadBtn({
  label,
  icon,
  variant,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  variant: "solid" | "outline"
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-all ${
        variant === "solid" ? "btn-primary shimmer-btn" : "btn-outline"
      }`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
    >
      {icon}
      {label}
    </motion.button>
  )
}

export default function ResultsSection({ results }: Props) {
  const [copied, setCopied] = useState(false)
  const deltaPct =
    Math.round(results.ats_score_after * 100) -
    Math.round(results.ats_score_before * 100)

  const copyLetter = () => {
    navigator.clipboard.writeText(results.cover_letter).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const downloadText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.section
      layoutId="results"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING }}
      className="flex flex-col gap-10"
    >
      {/* ATS Scores */}
      <div>
        <h3
          className="mb-5 text-base font-semibold tracking-tight"
          style={{ color: "#F0F4FF", letterSpacing: "-0.02em" }}
        >
          ATS Match Score
        </h3>
        <div className="flex gap-4">
          <ScoreCard
            label="Before"
            score={results.ats_score_before}
            delay={0}
            highlight={false}
          />
          <ScoreCard
            label="After"
            score={results.ats_score_after}
            delay={0.15}
            highlight
            delta={deltaPct > 0 ? deltaPct : undefined}
          />
        </div>
      </div>

      {/* Bullets */}
      {results.rewritten_bullets.length > 0 && (
        <div>
          <h3
            className="mb-5 text-base font-semibold tracking-tight"
            style={{ color: "#F0F4FF", letterSpacing: "-0.02em" }}
          >
            Rewritten Bullets
          </h3>
          <div className="flex flex-col gap-3">
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

      {/* Cover letter */}
      {results.cover_letter && (
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h3
              className="text-base font-semibold tracking-tight"
              style={{ color: "#F0F4FF", letterSpacing: "-0.02em" }}
            >
              Cover Letter
            </h3>
            <motion.button
              type="button"
              onClick={copyLetter}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
              style={{
                background: copied
                  ? "rgba(0,232,122,0.12)"
                  : "rgba(255,255,255,0.05)",
                color: copied ? "#00E87A" : "#8892A4",
                border: copied
                  ? "1px solid rgba(0,232,122,0.3)"
                  : "1px solid rgba(255,255,255,0.08)",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {copied ? "✓ Copied" : "Copy"}
            </motion.button>
          </div>

          <motion.div
            className="glass rounded-2xl p-7"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.1 }}
            style={{ boxShadow: "0 0 40px rgba(0,0,0,0.3)" }}
          >
            <p
              className="whitespace-pre-wrap text-sm leading-7"
              style={{
                color: "#F0F4FF",
                fontFamily: "var(--font-mono)",
              }}
            >
              {results.cover_letter}
            </p>
          </motion.div>
        </div>
      )}

      {/* Export row */}
      <div className="flex gap-3">
        <DownloadBtn
          variant="solid"
          label="Download Resume PDF"
          icon={
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path
                d="M7.5 1v9m0 0L4.5 7m3 3L10.5 7M2 13h11"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          onClick={() =>
            downloadText(results.rewritten_bullets.join("\n"), "resume-tailored.txt")
          }
        />
        <DownloadBtn
          variant="outline"
          label="Download Cover Letter"
          icon={
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path
                d="M7.5 1v9m0 0L4.5 7m3 3L10.5 7M2 13h11"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          onClick={() => downloadText(results.cover_letter, "cover-letter.txt")}
        />
      </div>
    </motion.section>
  )
}
