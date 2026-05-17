import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Applyn — AI Job Application Agent",
  description:
    "Paste any job URL. Applyn rewrites your resume to match the role — bullets, keywords, cover letter — all done by AI.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" style={{ background: "#080808" }}>
      <body style={{ background: "#080808", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  )
}
