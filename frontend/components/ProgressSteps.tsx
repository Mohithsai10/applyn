"use client"

import { motion, AnimatePresence } from "framer-motion"

const STEPS = [
  { icon: "🔍", label: "Scraping job posting..." },
  { icon: "🧠", label: "Extracting required skills..." },
  { icon: "📚", label: "Retrieving your best experience..." },
  { icon: "✍️", label: "Rewriting your resume bullets..." },
  { icon: "📊", label: "Calculating ATS match score..." },
  { icon: "📝", label: "Generating cover letter..." },
]

interface Props {
  currentStep: number // index of in-progress step; >= STEPS.length means all done
}

function Spinner() {
  return (
    <div
      className="h-4 w-4 rounded-full border-2 animate-spin-step"
      style={{ borderColor: "#00E87A", borderTopColor: "transparent" }}
    />
  )
}

function Checkmark() {
  return (
    <motion.svg
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <circle cx="8" cy="8" r="8" fill="rgba(0,232,122,0.15)" />
      <path
        d="M4.5 8.5L7 11L11.5 5.5"
        stroke="#00E87A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  )
}

export default function ProgressSteps({ currentStep }: Props) {
  const visibleCount = Math.min(currentStep + 1, STEPS.length)

  return (
    <motion.div
      className="glass rounded-2xl p-5 space-y-2.5 overflow-hidden"
      initial={{ opacity: 0, y: 16, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: 12, height: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-3"
        style={{ color: "#8892A4" }}
      >
        Agent running
      </p>

      <AnimatePresence initial={false}>
        {STEPS.slice(0, visibleCount).map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 28,
                delay: 0,
              }}
              className="flex items-center gap-3"
            >
              <span className="text-base w-5 text-center leading-none select-none">
                {step.icon}
              </span>

              <span
                className="flex-1 text-sm"
                style={{
                  color: isCompleted
                    ? "#F0F4FF"
                    : isCurrent
                      ? "#F0F4FF"
                      : "#8892A4",
                  fontWeight: isCurrent ? 500 : 400,
                }}
              >
                {step.label}
              </span>

              {isCompleted ? <Checkmark /> : isCurrent ? <Spinner /> : null}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </motion.div>
  )
}

export { STEPS }
