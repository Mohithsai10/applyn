"use client"

import { motion } from "framer-motion"

const ORBS = [
  {
    width: 800,
    height: 800,
    color: "#00FF87",
    opacity: 0.03,
    pos: { top: "-10%", left: "-10%" },
    animate: { x: [0, 300, -200, 100, 0], y: [0, -200, 300, -100, 0] },
    duration: 20,
  },
  {
    width: 700,
    height: 700,
    color: "#00CC6A",
    opacity: 0.025,
    pos: { top: "-5%", right: "-5%" },
    animate: { x: [0, -300, 200, -100, 0], y: [0, 200, -300, 100, 0] },
    duration: 25,
  },
  {
    width: 600,
    height: 600,
    color: "#00FF87",
    opacity: 0.035,
    pos: { top: "40%", left: "30%" },
    animate: { x: [0, 200, -300, 150, 0], y: [0, -150, 200, -50, 0] },
    duration: 15,
  },
  {
    width: 750,
    height: 750,
    color: "#00CC6A",
    opacity: 0.025,
    pos: { bottom: "-10%", left: "-5%" },
    animate: { x: [0, 250, -150, 80, 0], y: [0, -100, 200, -80, 0] },
    duration: 18,
  },
  {
    width: 650,
    height: 650,
    color: "#00FF87",
    opacity: 0.03,
    pos: { bottom: "-5%", right: "-10%" },
    animate: { x: [0, -200, 300, -100, 0], y: [0, -200, 100, -50, 0] },
    duration: 22,
  },
  {
    width: 700,
    height: 700,
    color: "#00CC6A",
    opacity: 0.025,
    pos: { top: "30%", right: "10%" },
    animate: { x: [0, -150, 200, -80, 0], y: [0, 200, -150, 80, 0] },
    duration: 12,
  },
]

export default function AnimatedBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          animate={orb.animate}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            width: orb.width,
            height: orb.height,
            borderRadius: "50%",
            background: orb.color,
            opacity: orb.opacity,
            filter: "blur(100px)",
            ...orb.pos,
          }}
        />
      ))}
    </div>
  )
}
