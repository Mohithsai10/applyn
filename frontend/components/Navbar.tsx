"use client"

import { useEffect, useState } from "react"

export default function Navbar() {
  const [hidden, setHidden] = useState(false)
  const [lastY, setLastY] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setHidden(y > lastY && y > 80)
      setLastY(y)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [lastY])

  return (
    <header
      className="sticky top-0 z-50 w-full transition-transform duration-300"
      style={{
        transform: hidden ? "translateY(-100%)" : "translateY(0)",
        background: "rgba(10, 15, 30, 0.75)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
          >
            <path
              d="M10 1L13 7.5H19L14 11.5L16 18L10 14L4 18L6 11.5L1 7.5H7L10 1Z"
              fill="#00E87A"
              stroke="#00E87A"
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="text-lg font-bold tracking-tight"
            style={{ color: "#F0F4FF", letterSpacing: "-0.03em" }}
          >
            Applyn
          </span>
        </div>

        {/* Badge */}
        <p
          className="text-xs font-medium"
          style={{ color: "#8892A4", letterSpacing: "0.01em" }}
        >
          Powered by{" "}
          <span style={{ color: "#00E87A" }}>Claude</span>
          {" + "}
          <span style={{ color: "#00B8D4" }}>LangGraph</span>
        </p>
      </div>
    </header>
  )
}
