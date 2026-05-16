import type { Metadata } from "next"
import { Syne, DM_Sans } from "next/font/google"
import "./globals.css"

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-heading",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
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
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable}`}
      style={{ background: "#080808" }}
    >
      <body style={{ background: "#080808", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  )
}
