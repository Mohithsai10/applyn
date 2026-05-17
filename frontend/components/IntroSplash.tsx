"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Props {
  onComplete: () => void
}

export default function IntroSplash({ onComplete }: Props) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Skip if already seen this session
    if (sessionStorage.getItem("applyn_splash_seen")) {
      setShow(false)
      onComplete()
      return
    }

    // 0.8s (enter) + 1.5s (hold) = 2.3s before starting exit
    const exitTimer = setTimeout(() => {
      setShow(false)
      sessionStorage.setItem("applyn_splash_seen", "1")
      // wait for 0.8s exit animation before signalling done
      setTimeout(onComplete, 800)
    }, 2300)

    return () => clearTimeout(exitTimer)
  }, [onComplete])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "#080808",
            zIndex: 9998,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "all",
          }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              fontFamily: "var(--font-heading), sans-serif",
              fontSize: "clamp(72px, 10vw, 120px)",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            Applyn
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            style={{
              fontFamily: "var(--font-body), sans-serif",
              fontSize: 20,
              color: "#555",
              marginTop: 16,
              letterSpacing: "-0.01em",
            }}
          >
            Every job deserves a perfect resume.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
