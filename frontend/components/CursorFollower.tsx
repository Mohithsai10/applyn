"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

export default function CursorFollower() {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const springX = useSpring(x, { stiffness: 400, damping: 28 })
  const springY = useSpring(y, { stiffness: 400, damping: 28 })
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX - 10)
      y.set(e.clientY - 10)
    }
    const onOver = (e: MouseEvent) => {
      if ((e.target as Element).closest('button, a, input, textarea, [role="button"]')) {
        setHovered(true)
      }
    }
    const onOut = (e: MouseEvent) => {
      if ((e.target as Element).closest('button, a, input, textarea, [role="button"]')) {
        setHovered(false)
      }
    }
    window.addEventListener("mousemove", onMove)
    document.addEventListener("mouseover", onOver)
    document.addEventListener("mouseout", onOut)
    return () => {
      window.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseover", onOver)
      document.removeEventListener("mouseout", onOut)
    }
  }, [x, y])

  return (
    <motion.div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        x: springX,
        y: springY,
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: "1.5px solid rgba(0,255,135,0.6)",
        pointerEvents: "none",
        zIndex: 9999,
      }}
      animate={{
        scale: hovered ? 2.5 : 1,
        background: hovered
          ? "rgba(0,255,135,0.2)"
          : "rgba(0,255,135,0.1)",
      }}
      transition={{ duration: 0.15 }}
    />
  )
}
