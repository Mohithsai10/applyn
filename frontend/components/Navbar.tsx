"use client"

import { useEffect, useState } from "react"

const NAV_LINKS = ["How it works", "Pricing", "About"]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 24)
    window.addEventListener("scroll", handle, { passive: true })
    return () => window.removeEventListener("scroll", handle)
  }, [])

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        width: "100%",
        background: "rgba(8,8,8,0.85)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid #141414",
        boxShadow: scrolled ? "0 8px 40px rgba(0,0,0,0.5)" : "none",
        transition: "box-shadow 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "20px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <span
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          Applyn
        </span>

        {/* Centre links */}
        <nav style={{ display: "flex", gap: 40 }}>
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href="#"
              style={{
                color: "#555",
                fontSize: 14,
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
            >
              {link}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <button
          onClick={() =>
            document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" })
          }
          style={{
            background: "#00FF87",
            color: "#000",
            fontWeight: 600,
            fontSize: 14,
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            transition: "filter 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
        >
          Get started free →
        </button>
      </div>
    </header>
  )
}
