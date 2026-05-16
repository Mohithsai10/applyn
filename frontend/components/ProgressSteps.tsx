"use client"

import { motion, AnimatePresence } from "framer-motion"

export const STEPS = [
  { icon: "🔍", label: "Scraping job posting..." },
  { icon: "🧠", label: "Extracting required skills..." },
  { icon: "📚", label: "Retrieving your best experience..." },
  { icon: "✍️", label: "Rewriting your resume bullets..." },
  { icon: "📊", label: "Calculating ATS match score..." },
  { icon: "📝", label: "Generating cover letter..." },
]

interface Props {
  currentStep: number
}

function Spinner() {
  return (
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        border: "2px solid #1a1a1a",
        borderTop: "2px solid #00FF87",
        animation: "spin 0.8s linear infinite",
        flexShrink: 0,
      }}
    />
  )
}

function Checkmark() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "rgba(0,255,135,0.15)",
        border: "1px solid rgba(0,255,135,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 9,
        color: "#00FF87",
        flexShrink: 0,
      }}
    >
      ✓
    </motion.div>
  )
}

export default function ProgressSteps({ currentStep }: Props) {
  const visibleCount = Math.min(currentStep + 1, STEPS.length)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: 12, height: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      className="card-dark"
      style={{ overflow: "hidden" }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#333",
          marginBottom: 16,
        }}
      >
        Agent running
      </p>

      <AnimatePresence initial={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {STEPS.slice(0, visibleCount).map((step, index) => {
            const isCompleted = index < currentStep
            const isCurrent = index === currentStep
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <span style={{ fontSize: 14, width: 20, textAlign: "center", flexShrink: 0 }}>
                  {step.icon}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: isCompleted || isCurrent ? "#fff" : "#555",
                    fontWeight: isCurrent ? 500 : 400,
                  }}
                >
                  {step.label}
                </span>
                {isCompleted ? <Checkmark /> : isCurrent ? <Spinner /> : null}
              </motion.div>
            )
          })}
        </div>
      </AnimatePresence>
    </motion.div>
  )
}
