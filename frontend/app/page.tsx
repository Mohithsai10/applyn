"use client"

import { useState } from "react"
import Navbar from "@/components/Navbar"
import Hero from "@/components/Hero"
import UploadSection from "@/components/UploadSection"
import JobInput from "@/components/JobInput"
import ResultsSection from "@/components/ResultsSection"

export interface AnalyzeResponse {
  job_url: string
  job_description: string
  top_skills: string[]
  company_name: string
  seniority_level: string
  relevant_bullets: string[]
  rewritten_bullets: string[]
  ats_score_before: number
  ats_score_after: number
  cover_letter: string
  error: string
  retry_count: number
}

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [results, setResults] = useState<AnalyzeResponse | null>(null)

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 70% 0%, rgba(0,232,122,0.05) 0%, transparent 60%)," +
          "radial-gradient(ellipse 60% 50% at 10% 100%, rgba(0,184,212,0.04) 0%, transparent 60%)," +
          "#0A0F1E",
      }}
    >
      {/* Subtle grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <Navbar />

      <Hero />

      <main className="relative z-10 mx-auto max-w-3xl px-5 pb-40 space-y-14">
        <UploadSection
          onUpload={(sid) => {
            setSessionId(sid)
            if (typeof window !== "undefined") {
              localStorage.setItem("applyn_session_id", sid)
            }
          }}
        />

        <JobInput sessionId={sessionId} onResults={setResults} />

        {results && <ResultsSection results={results} />}
      </main>
    </div>
  )
}
