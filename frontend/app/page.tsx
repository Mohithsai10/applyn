"use client"

import { useEffect, useRef, useState } from "react"
import IntroSplash from "@/components/IntroSplash"
import AnimatedBackground from "@/components/AnimatedBackground"
import CursorFollower from "@/components/CursorFollower"
import Navbar from "@/components/Navbar"
import Hero from "@/components/Hero"
import HowItWorks from "@/components/HowItWorks"
import UploadSection from "@/components/UploadSection"
import JobInput from "@/components/JobInput"
import ResultsSection from "@/components/ResultsSection"
import SocialProof from "@/components/SocialProof"
import Footer from "@/components/Footer"
import { STEPS } from "@/components/ProgressSteps"
import {
  checkBackend,
  uploadResume,
  analyzeJob,
  downloadResume,
  saveCoverLetter,
  triggerDownload,
  type AnalyzeResult,
} from "@/lib/api"

export type { AnalyzeResult }

export default function Home() {
  const [splashDone, setSplashDone] = useState(false)
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)

  // Upload state
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("applyn_session_id")
    return null
  })
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [chunks, setChunks] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Analyze state
  const [results, setResults] = useState<AnalyzeResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [slowWarning, setSlowWarning] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Download state
  const [downloadingResume, setDownloadingResume] = useState(false)

  useEffect(() => {
    checkBackend().then(setBackendOnline)
  }, [])

  const handleUpload = async (file: File) => {
    setUploading(true)
    setUploadError(null)
    setUploaded(false)
    try {
      const data = await uploadResume(file)
      setSessionId(data.session_id)
      setChunks(data.chunks_stored)
      setUploaded(true)
      localStorage.setItem("applyn_session_id", data.session_id)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleAnalyze = async (url: string) => {
    if (!sessionId) return
    setAnalyzing(true)
    setCurrentStep(0)
    setSlowWarning(false)
    setAnalyzeError(null)
    setResults(null)

    let step = 0
    stepTimerRef.current = setInterval(() => {
      step = Math.min(step + 1, STEPS.length - 1)
      setCurrentStep(step)
    }, 5000)

    try {
      const data = await analyzeJob(url, sessionId, () => setSlowWarning(true))
      if (stepTimerRef.current) clearInterval(stepTimerRef.current)
      setCurrentStep(STEPS.length - 1)
      await new Promise((r) => setTimeout(r, 500))
      if (data.error) throw new Error(data.error)
      setResults(data)
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Analysis failed")
    } finally {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current)
      setAnalyzing(false)
      setCurrentStep(-1)
    }
  }

  const handleDownloadResume = async () => {
    if (!sessionId) return
    setDownloadingResume(true)
    try {
      const { blob, filename } = await downloadResume(sessionId)
      triggerDownload(blob, filename)
    } catch (err) {
      console.error("Resume download failed:", err)
    } finally {
      setDownloadingResume(false)
    }
  }

  const handleDownloadCover = () => {
    if (!results?.cover_letter) return
    saveCoverLetter(results.cover_letter, results.company_name)
  }

  const handleResetUpload = () => {
    setUploaded(false)
    setUploadError(null)
    setChunks(0)
    setSessionId(null)
    localStorage.removeItem("applyn_session_id")
  }

  return (
    <>
      {!splashDone && <IntroSplash onComplete={() => setSplashDone(true)} />}
      <AnimatedBackground />
      <CursorFollower />

      {backendOnline === false && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 200,
            background: "rgba(255,77,77,0.12)",
            borderBottom: "1px solid rgba(255,77,77,0.3)",
            padding: "10px 24px",
            textAlign: "center",
            fontSize: 13,
            color: "rgba(255,77,77,0.9)",
          }}
        >
          Backend offline — start the FastAPI server at localhost:8000
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, paddingTop: backendOnline === false ? 40 : 0 }}>
        <Navbar />
        <Hero />
        <HowItWorks />
        <UploadSection
          onUpload={handleUpload}
          uploading={uploading}
          uploaded={uploaded}
          chunks={chunks}
          uploadError={uploadError}
          onReset={handleResetUpload}
        />
        <JobInput
          onAnalyze={handleAnalyze}
          analyzing={analyzing}
          disabled={!sessionId || !uploaded}
          slowWarning={slowWarning}
          analyzeError={analyzeError}
          currentStep={currentStep}
        />
        {results && (
          <ResultsSection
            results={results}
            sessionId={sessionId!}
            onDownloadResume={handleDownloadResume}
            onDownloadCover={handleDownloadCover}
            downloadingResume={downloadingResume}
          />
        )}
        <SocialProof />
        <Footer />
      </div>
    </>
  )
}
