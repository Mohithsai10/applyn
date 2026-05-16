"use client"

import { useCallback, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const API = "http://localhost:8000"
const SPRING = { type: "spring" as const, stiffness: 280, damping: 28 }

interface Props {
  onUpload: (sessionId: string) => void
}

type State = "idle" | "dragging" | "uploading" | "success" | "error"

function CloudIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      style={{ color: "#00E87A" }}
    >
      <path
        d="M28 26H30.5C33.54 26 36 23.54 36 20.5C36 17.67 33.83 15.35 31.07 15.05C30.37 11.58 27.27 9 23.5 9C20.55 9 17.96 10.56 16.51 12.92C15.85 12.64 15.13 12.5 14.4 12.5C11.41 12.5 9 14.91 9 17.9C9 17.94 9 17.97 9.01 18H9C7.34 18 6 19.34 6 21C6 22.66 7.34 24 9 24H14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 22V34M20 34L16 30M20 34L24 30"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <motion.svg
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
    >
      <circle cx="22" cy="22" r="22" fill="rgba(0,232,122,0.12)" />
      <circle
        cx="22"
        cy="22"
        r="21"
        stroke="rgba(0,232,122,0.4)"
        strokeWidth="1"
      />
      <path
        d="M13 22L19.5 28.5L31 15"
        stroke="#00E87A"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  )
}

export default function UploadSection({ onUpload }: Props) {
  const [state, setState] = useState<State>("idle")
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState("")
  const [chunks, setChunks] = useState(0)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = useCallback(
    async (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase()
      if (ext !== "pdf" && ext !== "docx") {
        setError("Only PDF or DOCX files are accepted.")
        setState("error")
        return
      }
      setFileName(file.name)
      setState("uploading")
      setProgress(0)

      // Fake progress animation while uploading
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 8, 85))
      }, 120)

      try {
        const form = new FormData()
        form.append("file", file)
        const res = await fetch(`${API}/upload-resume`, {
          method: "POST",
          body: form,
        })
        clearInterval(interval)

        if (!res.ok) {
          const body = await res.json().catch(() => ({ detail: "Upload failed" }))
          throw new Error(body.detail ?? "Upload failed")
        }

        setProgress(100)
        const data = await res.json()
        setChunks(data.chunks_stored)
        localStorage.setItem("applyn_session_id", data.session_id)

        setTimeout(() => {
          setState("success")
          onUpload(data.session_id)
        }, 400)
      } catch (err: unknown) {
        clearInterval(interval)
        setError(err instanceof Error ? err.message : "Upload failed")
        setState("error")
      }
    },
    [onUpload]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setState("idle")
      const file = e.dataTransfer.files[0]
      if (file) upload(file)
    },
    [upload]
  )

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) upload(file)
    },
    [upload]
  )

  const isDragging = state === "dragging"
  const isUploading = state === "uploading"
  const isSuccess = state === "success"
  const isError = state === "error"

  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
          style={{
            background: "rgba(0,232,122,0.12)",
            color: "#00E87A",
            border: "1px solid rgba(0,232,122,0.3)",
          }}
        >
          1
        </span>
        <h2
          className="text-lg font-semibold tracking-tight"
          style={{ color: "#F0F4FF", letterSpacing: "-0.02em" }}
        >
          Upload your resume
        </h2>
      </div>

      {/* Drop zone */}
      <motion.div
        className="relative rounded-2xl p-10 text-center cursor-pointer select-none"
        style={{
          background: isDragging
            ? "rgba(0,232,122,0.04)"
            : "rgba(255,255,255,0.03)",
          border: isDragging
            ? "1.5px dashed rgba(0,232,122,0.6)"
            : isSuccess
              ? "1.5px solid rgba(0,232,122,0.4)"
              : isError
                ? "1.5px solid rgba(255,80,80,0.4)"
                : "1.5px dashed rgba(255,255,255,0.12)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: isDragging
            ? "0 0 40px rgba(0,232,122,0.12)"
            : isSuccess
              ? "0 0 30px rgba(0,232,122,0.1)"
              : "none",
          transition: "all 0.2s ease",
        }}
        onDragEnter={(e) => { e.preventDefault(); setState("dragging") }}
        onDragOver={(e) => { e.preventDefault(); setState("dragging") }}
        onDragLeave={() => setState("idle")}
        onDrop={onDrop}
        onClick={() => !isUploading && !isSuccess && inputRef.current?.click()}
        whileHover={
          !isUploading && !isSuccess
            ? { scale: 1.005, transition: { duration: 0.15 } }
            : {}
        }
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={onFileChange}
        />

        <AnimatePresence mode="wait">
          {/* Idle / dragging */}
          {(state === "idle" || state === "dragging") && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div
                style={{
                  filter: isDragging ? "drop-shadow(0 0 12px rgba(0,232,122,0.5))" : "none",
                  transition: "filter 0.2s ease",
                }}
              >
                <CloudIcon />
              </div>
              <div>
                <p
                  className="text-base font-semibold mb-1"
                  style={{ color: isDragging ? "#00E87A" : "#F0F4FF" }}
                >
                  {isDragging ? "Drop it!" : "Drop your resume here"}
                </p>
                <p className="text-sm" style={{ color: "#8892A4" }}>
                  PDF or DOCX · Max 10 MB
                </p>
              </div>
              <button
                type="button"
                className="btn-primary shimmer-btn rounded-xl px-6 py-2.5 text-sm"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
              >
                Browse files
              </button>
            </motion.div>
          )}

          {/* Uploading */}
          {isUploading && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <p className="text-sm" style={{ color: "#8892A4" }}>
                Uploading{" "}
                <span style={{ color: "#F0F4FF" }}>{fileName}</span>
              </p>
              <div
                className="relative h-1.5 w-60 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #00E87A, #00B8D4)",
                    width: `${progress}%`,
                  }}
                  transition={{ duration: 0.15 }}
                />
                {/* Shimmer overlay */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.2s ease-in-out infinite",
                  }}
                />
              </div>
              <p className="text-xs" style={{ color: "#8892A4" }}>
                {progress}%
              </p>
            </motion.div>
          )}

          {/* Success */}
          {isSuccess && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <CheckIcon />
              <div>
                <p
                  className="text-base font-semibold"
                  style={{ color: "#F0F4FF" }}
                >
                  {fileName}
                </p>
                <p
                  className="text-sm mt-0.5 font-medium"
                  style={{ color: "#00E87A" }}
                >
                  ✓ {chunks} bullets indexed
                </p>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {isError && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <p className="text-sm" style={{ color: "rgba(255,100,100,0.9)" }}>
                {error}
              </p>
              <button
                type="button"
                className="text-xs underline"
                style={{ color: "#8892A4" }}
                onClick={() => setState("idle")}
              >
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}
