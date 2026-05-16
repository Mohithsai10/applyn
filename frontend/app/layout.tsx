import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Applyn — AI Job Application Agent",
  description:
    "Paste any job URL. Applyn rewrites your resume to match the role — bullets, keywords, cover letter — all done by AI.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} style={{ background: "#080808" }}>
      <body style={{ background: "#080808", minHeight: "100vh" }}>{children}</body>
    </html>
  )
}
