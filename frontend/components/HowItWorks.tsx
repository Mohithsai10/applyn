"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"

const STEPS = [
  {
    num: "01",
    title: "Upload your resume",
    desc: "Drop your PDF or DOCX. Applyn indexes every bullet point into AI memory for semantic retrieval.",
  },
  {
    num: "02",
    title: "Paste a job URL",
    desc: "Any job board — LinkedIn, Indeed, Greenhouse, Workday. Applyn scrapes the full description instantly.",
  },
  {
    num: "03",
    title: "AI tailors everything",
    desc: "LangGraph agent rewrites your bullets, scores ATS match, and writes a personalised cover letter.",
  },
  {
    num: "04",
    title: "Download & apply",
    desc: "Get a perfectly formatted one-page resume PDF, ready to send in seconds.",
  },
]

export default function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.15 })

  return (
    <section id="how" className="section" style={{ background: "#080808" }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <span className="badge">The Process</span>
          <h2
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#fff",
              marginTop: 24,
              lineHeight: 1,
            }}
          >
            How Applyn works
          </h2>
          <p
            style={{
              color: "#555",
              fontSize: 18,
              marginTop: 16,
              lineHeight: 1.6,
            }}
          >
            From resume to tailored application in under a minute.
          </p>
        </div>

        {/* 2×2 Grid */}
        <div
          ref={ref}
          className="two-col"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              className="card-dark"
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 28,
                delay: i * 0.1,
              }}
            >
              <span
                style={{
                  color: "#00FF87",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                }}
              >
                {step.num}
              </span>
              <h3
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#fff",
                  marginTop: 20,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: 16,
                  color: "#555",
                  marginTop: 10,
                  lineHeight: 1.65,
                }}
              >
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
