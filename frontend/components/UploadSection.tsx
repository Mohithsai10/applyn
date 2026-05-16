"use client"

import { useCallback, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const API = "http://localhost:8000"

const FEATURES = [
  "Parses PDF & DOCX formats",
  "Indexes every bullet into AI memory",
  "Secure — never stored permanently",
]

interface Props {
  onUpload: (sessionId: string) => void
}

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error"

export default function UploadSection({ onUpload }: Props) {
  const [state, setState] = useState<UploadState>("idle")
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

      try {
        const form = new FormData()
        form.append("file", file)
        const res = await fetch(`${API}/upload-resume`, { method: "POST", body: form })
        if (!res.ok) {
          const body = await res.json().catch(() => ({ detail: "Upload failed" }))
          throw new Error(body.detail ?? "Upload failed")
        }
        const data = await res.json()
        setChunks(data.chunks_stored ?? data.bullet_count ?? 0)
        localStorage.setItem("applyn_session_id", data.session_id)
        setState("success")
        onUpload(data.session_id)
      } catch (err: unknown) {
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

  const isDragging = state === "dragging"
  const isSuccess = state === "success"

  return (
    <section id="upload" className="section" style={{ background: "#080808" }}>
      <div className="container">
        <div
          className="two-col"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 80,
            alignItems: "center",
          }}
        >
          {/* Left — text */}
          <div style={{ maxWidth: 420 }}>
            <h2
              style={{
                fontSize: "clamp(32px, 4vw, 48px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#fff",
                lineHeight: 1.1,
              }}
            >
              Upload your resume
            </h2>
            <p style={{ color: "#555", fontSize: 18, marginTop: 16, lineHeight: 1.65 }}>
              Drop your existing resume and Applyn indexes every bullet into AI
              memory for precise semantic retrieval.
            </p>
            <ul
              style={{
                marginTop: 32,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                listStyle: "none",
              }}
            >
              {FEATURES.map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "rgba(0,255,135,0.1)",
                      border: "1px solid rgba(0,255,135,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      color: "#00FF87",
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </span>
                  <span style={{ color: "#888", fontSize: 15 }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — upload zone */}
          <div>
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="card-dark"
                  style={{
                    minHeight: 280,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    border: "1px solid rgba(0,255,135,0.2)",
                    boxShadow: "0 0 40px rgba(0,255,135,0.05)",
                  }}
                >
                  <span className="badge" style={{ marginBottom: 4 }}>Step 01</span>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "rgba(0,255,135,0.1)",
                      border: "1px solid rgba(0,255,135,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      color: "#00FF87",
                    }}
                  >
                    ✓
                  </motion.div>
                  <p style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{fileName}</p>
                  <p style={{ color: "#00FF87", fontSize: 14, fontWeight: 500 }}>
                    ✓ {chunks} bullets indexed into AI memory
                  </p>
                  <button
                    onClick={() => setState("idle")}
                    style={{
                      marginTop: 8,
                      background: "transparent",
                      border: "1px solid #222",
                      color: "#555",
                      fontSize: 13,
                      padding: "8px 16px",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    Replace file
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="card-dark"
                  onClick={() => state !== "uploading" && inputRef.current?.click()}
                  onDragEnter={(e) => { e.preventDefault(); setState("dragging") }}
                  onDragOver={(e) => { e.preventDefault(); setState("dragging") }}
                  onDragLeave={() => setState("idle")}
                  onDrop={onDrop}
                  style={{
                    minHeight: 280,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    cursor: state === "uploading" ? "default" : "pointer",
                    border: isDragging
                      ? "2px dashed #00FF87"
                      : state === "error"
                        ? "2px dashed rgba(255,77,77,0.4)"
                        : "2px dashed #1f1f1f",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    boxShadow: isDragging ? "0 0 40px rgba(0,255,135,0.08)" : "none",
                  }}
                  whileHover={state === "idle" ? { borderColor: "#00FF87" } as never : {}}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.docx"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) upload(f)
                    }}
                  />

                  <span className="badge" style={{ position: "absolute", top: 20 }}>
                    Step 01
                  </span>

                  {state === "uploading" ? (
                    <>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          border: "2px solid #1a1a1a",
                          borderTop: "2px solid #00FF87",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                      <p style={{ color: "#555", fontSize: 14 }}>Uploading {fileName}…</p>
                    </>
                  ) : state === "error" ? (
                    <>
                      <p style={{ color: "rgba(255,77,77,0.9)", fontSize: 14 }}>{error}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setState("idle") }}
                        style={{
                          background: "transparent",
                          border: "1px solid #222",
                          color: "#555",
                          fontSize: 13,
                          padding: "8px 16px",
                          borderRadius: 8,
                          cursor: "pointer",
                        }}
                      >
                        Try again
                      </button>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 12,
                          background: "rgba(0,255,135,0.05)",
                          border: "1px solid rgba(0,255,135,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 24,
                        }}
                      >
                        📄
                      </div>
                      <p style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>
                        {isDragging ? "Drop it!" : "Drop your resume here"}
                      </p>
                      <p style={{ color: "#555", fontSize: 13 }}>
                        or{" "}
                        <span style={{ color: "#00FF87", textDecoration: "underline" }}>
                          browse files
                        </span>
                      </p>
                      <p style={{ color: "#333", fontSize: 12 }}>PDF or DOCX · Max 10 MB</p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
