const LINKS = ["Privacy", "Terms", "GitHub", "Status"]

export default function Footer() {
  return (
    <footer
      style={{
        background: "#050505",
        borderTop: "1px solid #111",
        padding: "64px 0",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 24,
        }}
      >
        {/* Left */}
        <div>
          <span
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Applyn
          </span>
          <p style={{ color: "#333", fontSize: 13, marginTop: 6 }}>
            © 2025 Applyn. All rights reserved.
          </p>
        </div>

        {/* Center */}
        <nav style={{ display: "flex", gap: 32 }}>
          {LINKS.map((link) => (
            <a
              key={link}
              href="#"
              style={{
                color: "#444",
                fontSize: 14,
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
            >
              {link}
            </a>
          ))}
        </nav>

        {/* Right */}
        <p style={{ color: "#333", fontSize: 13 }}>Built in Toronto 🇨🇦</p>
      </div>
    </footer>
  )
}
