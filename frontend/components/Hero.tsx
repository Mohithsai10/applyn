"use client"

import { motion } from "framer-motion"

const SPRING = { type: "spring" as const, stiffness: 280, damping: 28 }

const headline1 = "Your next job"
const headline2 = "starts here."

const PILLS = [
  { emoji: "🔍", label: "Scrapes any job URL" },
  { emoji: "✍️", label: "Rewrites your bullets" },
  { emoji: "📄", label: "Personalised cover letter" },
]

function AnimatedWord({
  word,
  baseDelay,
  className,
}: {
  word: string
  baseDelay: number
  className?: string
}) {
  return (
    <span className="inline-flex overflow-hidden" aria-hidden>
      {word.split("").map((ch, i) => (
        <motion.span
          key={i}
          className={className}
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...SPRING, delay: baseDelay + i * 0.028 }}
          style={{ display: "inline-block" }}
        >
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </span>
  )
}

export default function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 text-center">
      {/* Floating background blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full animate-float"
        style={{
          background:
            "radial-gradient(circle, rgba(0,232,122,0.07) 0%, rgba(0,184,212,0.04) 40%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex max-w-2xl flex-col items-center gap-8">
        {/* Headline */}
        <h1
          className="font-bold leading-none tracking-tight select-none"
          style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)", letterSpacing: "-0.04em" }}
        >
          <span className="block" aria-label={headline1}>
            <AnimatedWord
              word={headline1}
              baseDelay={0.1}
              className="text-[#F0F4FF]"
            />
          </span>
          <span className="block" aria-label={headline2}>
            <AnimatedWord
              word={headline2}
              baseDelay={0.5}
              className="text-gradient"
            />
          </span>
        </h1>

        {/* Subtext */}
        <motion.p
          className="max-w-lg text-base leading-relaxed"
          style={{ color: "#8892A4" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 1.1 }}
        >
          Paste a job URL. Applyn reads the posting, rewrites your resume
          bullets to match, and generates a cover letter —{" "}
          <span style={{ color: "#F0F4FF", fontWeight: 500 }}>
            all in 30 seconds.
          </span>
        </motion.p>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {PILLS.map((pill, i) => (
            <motion.div
              key={pill.label}
              className="glass glow-border flex cursor-default items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
              style={{ color: "#F0F4FF" }}
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...SPRING, delay: 1.3 + i * 0.1 }}
              whileHover={{
                y: -3,
                boxShadow: "0 8px 30px rgba(0,232,122,0.2)",
                transition: { duration: 0.15 },
              }}
            >
              <span>{pill.emoji}</span>
              <span>{pill.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <p className="text-xs" style={{ color: "#8892A4" }}>
          scroll to start
        </p>
        <div className="animate-bounce-y">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            style={{ color: "#00E87A" }}
          >
            <path
              d="M5 8L10 13L15 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </motion.div>
    </section>
  )
}
