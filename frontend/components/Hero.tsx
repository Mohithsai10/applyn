"use client"

import { motion } from "framer-motion"

const SPRING = { type: "spring" as const, stiffness: 280, damping: 28 }

const COMPANIES = [
  "Google", "Amazon", "Shopify", "Stripe", "Vercel",
  "Microsoft", "Meta", "Apple", "Linear", "Notion",
]

function FadeUp({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode
  delay?: number
  style?: React.CSSProperties
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

export default function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        paddingBottom: 80,
      }}
    >
      {/* ── Atmospheric glow ─────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          background:
            "radial-gradient(circle, rgba(0,255,135,0.07) 0%, transparent 70%)",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Drifting orbs ────────────────────────────────────── */}
      <motion.div
        aria-hidden
        animate={{ x: [0, 90, -60, 50, 0], y: [0, -80, 45, -35, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          background: "rgba(0,255,135,0.05)",
          borderRadius: "50%",
          filter: "blur(120px)",
          top: "5%",
          left: "2%",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <motion.div
        aria-hidden
        animate={{ x: [0, -100, 70, -50, 0], y: [0, 70, -55, 40, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          background: "rgba(0,200,100,0.03)",
          borderRadius: "50%",
          filter: "blur(120px)",
          top: "25%",
          right: "2%",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <motion.div
        aria-hidden
        animate={{ x: [0, 60, -90, 40, 0], y: [0, -40, 70, -50, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          background: "rgba(0,255,135,0.04)",
          borderRadius: "50%",
          filter: "blur(120px)",
          bottom: "-10%",
          left: "25%",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Content ──────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: 800,
          padding: "0 24px",
        }}
      >
        <FadeUp delay={0}>
          <span className="badge">✦ AI-powered · Free to try</span>
        </FadeUp>

        <FadeUp delay={0.1} style={{ marginTop: 28 }}>
          <h1
            style={{
              fontSize: "clamp(52px, 7.5vw, 88px)",
              fontWeight: 800,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
            }}
          >
            <span style={{ display: "block", color: "#fff" }}>
              Land your dream job
            </span>
            <span style={{ display: "block", color: "#00FF87" }}>
              in 30 seconds.
            </span>
          </h1>
        </FadeUp>

        <FadeUp delay={0.2} style={{ marginTop: 24 }}>
          <p
            style={{
              color: "#555",
              fontSize: 18,
              lineHeight: 1.7,
              maxWidth: 560,
            }}
          >
            Paste any job URL. Applyn rewrites your resume to match the role —
            bullets, keywords, cover letter — all done by AI.
          </p>
        </FadeUp>

        <FadeUp delay={0.3} style={{ marginTop: 40 }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <motion.a
              href="#upload"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: "#00FF87",
                color: "#000",
                fontWeight: 700,
                fontSize: 16,
                padding: "16px 32px",
                borderRadius: 10,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Tailor my resume →
            </motion.a>

            <motion.a
              href="#how"
              whileHover={{ borderColor: "#555", color: "#fff" }}
              style={{
                background: "transparent",
                color: "#555",
                border: "1px solid #222",
                fontWeight: 600,
                fontSize: 16,
                padding: "16px 32px",
                borderRadius: 10,
                textDecoration: "none",
                display: "inline-block",
                transition: "all 0.2s ease",
              }}
            >
              See how it works
            </motion.a>
          </div>
        </FadeUp>

        <FadeUp delay={0.4} style={{ marginTop: 24 }}>
          <p style={{ color: "#444", fontSize: 13 }}>
            <span style={{ color: "#00FF87", marginRight: 8 }}>●</span>
            Used by 2,400+ job seekers this month
          </p>
        </FadeUp>
      </div>

      {/* ── Floating mockup card ──────────────────────────────── */}
      <FadeUp delay={0.5} style={{ marginTop: 64, position: "relative", zIndex: 1 }}>
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 680,
            maxWidth: "90vw",
            background: "#111",
            border: "1px solid #1a1a1a",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 40px 120px rgba(0,255,135,0.08)",
          }}
        >
          {/* Window chrome */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                <div
                  key={c}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: c,
                  }}
                />
              ))}
            </div>
            <span
              style={{
                flex: 1,
                textAlign: "center",
                color: "#333",
                fontSize: 12,
                fontFamily: "monospace",
              }}
            >
              Applyn — Resume Tailor
            </span>
          </div>

          {/* Before / After */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 32px 1fr",
              gap: 0,
              alignItems: "start",
            }}
          >
            <div>
              <p
                style={{
                  color: "#444",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                }}
              >
                📄 Original bullet
              </p>
              <p
                style={{
                  color: "#555",
                  fontSize: 14,
                  fontStyle: "italic",
                  lineHeight: 1.6,
                }}
              >
                Led a team project to improve processes
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                paddingTop: 22,
                color: "#333",
                fontSize: 18,
              }}
            >
              →
            </div>

            <div>
              <p
                style={{
                  color: "#00FF87",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                }}
              >
                ✓ Rewritten by Applyn
              </p>
              <p
                style={{
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 500,
                  lineHeight: 1.6,
                }}
              >
                Spearheaded cross-functional team of 8 engineers, delivering
                process improvements 3 weeks ahead of schedule — reducing
                overhead by 23%
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid #1a1a1a",
              textAlign: "right",
            }}
          >
            <span
              style={{ color: "#00FF87", fontSize: 12, fontWeight: 600 }}
            >
              ATS Score: 34% → 91% ↑
            </span>
          </div>
        </motion.div>
      </FadeUp>

      {/* ── Company marquee ──────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          marginTop: 56,
        }}
      >
        <p
          style={{
            textAlign: "center",
            color: "#333",
            fontSize: 12,
            letterSpacing: "0.05em",
            marginBottom: 16,
          }}
        >
          TAILORED FOR ROLES AT
        </p>
        <div style={{ overflow: "hidden", width: "100%" }}>
          <div
            style={{
              display: "flex",
              gap: 56,
              width: "max-content",
              animation: "marquee 28s linear infinite",
              alignItems: "center",
            }}
          >
            {[...COMPANIES, ...COMPANIES].map((name, i) => (
              <span
                key={i}
                style={{
                  color: "#2a2a2a",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap",
                  textTransform: "uppercase",
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
