import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Applyn — AI Job Application Agent",
  description:
    "Paste a job URL. Applyn rewrites your resume bullets to match and generates a personalised cover letter — in 30 seconds.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      style={{ background: "#0A0F1E" }}
    >
      <body
        className="min-h-screen antialiased"
        style={{ background: "#0A0F1E" }}
      >
        {children}
      </body>
    </html>
  )
}
