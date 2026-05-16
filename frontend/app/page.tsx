"use client"

import { useState } from "react"
import Navbar from "@/components/Navbar"
import Hero from "@/components/Hero"
import HowItWorks from "@/components/HowItWorks"
import UploadSection from "@/components/UploadSection"
import JobInput from "@/components/JobInput"
import ResultsSection from "@/components/ResultsSection"
import SocialProof from "@/components/SocialProof"
import Footer from "@/components/Footer"

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
    <>
      <Navbar />
      <Hero />
      <HowItWorks />
      <UploadSection onUpload={setSessionId} />
      <JobInput sessionId={sessionId} onResults={setResults} />
      {results && <ResultsSection results={results} />}
      <SocialProof />
      <Footer />
    </>
  )
}
