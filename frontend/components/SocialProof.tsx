"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"

const TESTIMONIALS = [
  {
    quote:
      "I applied to 12 roles in one afternoon. Applyn rewrote my bullets so precisely that a recruiter at Stripe reached out the same week.",
    name: "Sarah K.",
    role: "Software Engineer",
    score: "34% → 89%",
  },
  {
    quote:
      "The cover letters don't read like AI wrote them. They sound like me — but sharper. Got an interview at Linear in 48 hours.",
    name: "Marcus T.",
    role: "Product Manager",
    score: "41% → 92%",
  },
  {
    quote:
      "I was skeptical, but my ATS score jumped 50 points on the first try. Landed a data role at a Series B startup within two weeks.",
    name: "Priya M.",
    role: "Data Analyst",
    score: "38% → 91%",
  },
]

export default function SocialProof() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.15 })

  return (
    <section className="section" style={{ background: "#050505" }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <span className="badge">Social Proof</span>
          <h2
            style={{
              fontSize: "clamp(32px, 4.5vw, 52px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#fff",
              marginTop: 24,
              lineHeight: 1.1,
            }}
          >
            Job seekers love Applyn
          </h2>
          <p style={{ color: "#555", fontSize: 18, marginTop: 16, lineHeight: 1.6 }}>
            2,400+ applications sent this month.
          </p>
        </div>

        {/* Cards */}
        <div
          ref={ref}
          className="two-col"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 24,
          }}
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              className="card-dark"
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 28,
                delay: i * 0.1,
              }}
              style={{ display: "flex", flexDirection: "column", gap: 20, padding: 40, minHeight: 240 }}
            >
              {/* Stars */}
              <div style={{ display: "flex", gap: 4 }}>
                {Array.from({ length: 5 }).map((_, si) => (
                  <span key={si} style={{ color: "#00FF87", fontSize: 14 }}>
                    ★
                  </span>
                ))}
              </div>

              <p style={{ color: "#888", fontSize: 15, lineHeight: 1.7, flex: 1 }}>
                &ldquo;{t.quote}&rdquo;
              </p>

              <div
                style={{
                  paddingTop: 16,
                  borderTop: "1px solid #1a1a1a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{t.name}</p>
                  <p style={{ color: "#555", fontSize: 13, marginTop: 2 }}>{t.role}</p>
                </div>
                <span
                  style={{
                    color: "#00FF87",
                    fontSize: 12,
                    fontWeight: 600,
                    background: "rgba(0,255,135,0.07)",
                    border: "1px solid rgba(0,255,135,0.15)",
                    borderRadius: 999,
                    padding: "4px 10px",
                  }}
                >
                  {t.score}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
