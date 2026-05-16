from __future__ import annotations

import os
import re
from pathlib import Path

import chromadb
from chromadb import Collection
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction

# Matches lines that start with a bullet symbol, a numbered list marker,
# or a capital letter (resume-style summary lines), with a minimum 15-char length.
_BULLET_RE = re.compile(r"^(?:[•\-\*]|\d+[\.\)]|[A-Z])\s*.+")


# ── ChromaDB helpers ──────────────────────────────────────────────────────────

def get_client() -> chromadb.ClientAPI:
    persist_dir: str = os.getenv("CHROMA_PERSIST_DIR", "./data/chroma")
    return chromadb.PersistentClient(path=persist_dir)


def get_or_create_collection(client: chromadb.ClientAPI, name: str) -> Collection:
    return client.get_or_create_collection(name=name)


def _bullets_ef() -> OpenAIEmbeddingFunction:
    return OpenAIEmbeddingFunction(
        api_key=os.getenv("OPENAI_API_KEY"),
        model_name="text-embedding-3-small",
    )


def _bullets_collection() -> Collection:
    return get_client().get_or_create_collection(
        name="resume_bullets",
        embedding_function=_bullets_ef(),
    )


def upsert_documents(
    collection: Collection,
    documents: list[str],
    ids: list[str],
    metadatas: list[dict] | None = None,
) -> None:
    collection.upsert(documents=documents, ids=ids, metadatas=metadatas or [{}] * len(ids))


def query_collection(
    collection: Collection,
    query_texts: list[str],
    n_results: int = 5,
) -> list[list[str]]:
    results = collection.query(query_texts=query_texts, n_results=n_results)
    return results.get("documents", [])


# ── Resume retrieval ──────────────────────────────────────────────────────────

def retrieve_bullets(skills: list[str], n_results: int = 3) -> list[str]:
    collection = _bullets_collection()
    seen: set[str] = set()
    bullets: list[str] = []
    for skill in skills:
        try:
            results = collection.query(query_texts=[skill], n_results=n_results)
            for doc in (results.get("documents") or [[]])[0]:
                if doc not in seen:
                    seen.add(doc)
                    bullets.append(doc)
        except Exception:
            pass
    return bullets


# ── Resume ingestion ──────────────────────────────────────────────────────────

def _extract_text(file_path: str) -> str:
    suffix = Path(file_path).suffix.lower()
    if suffix == ".pdf":
        import fitz
        doc = fitz.open(file_path)
        return "\n".join(page.get_text() for page in doc)
    if suffix == ".docx":
        from docx import Document
        doc = Document(file_path)
        return "\n".join(para.text for para in doc.paragraphs)
    raise ValueError(f"Unsupported file type: {suffix}")


def _split_bullets(text: str) -> list[str]:
    chunks: list[str] = []
    for line in text.splitlines():
        line = line.strip()
        if len(line) >= 15 and _BULLET_RE.match(line):
            chunks.append(line)
    return chunks


def embed_resume(file_path: str) -> dict[str, object]:
    file_name = Path(file_path).name
    text = _extract_text(file_path)
    chunks = _split_bullets(text)

    if not chunks:
        return {"success": True, "chunks_stored": 0, "file_name": file_name}

    collection = _bullets_collection()
    ids = [f"{file_name}_chunk_{i}" for i in range(len(chunks))]
    metadatas: list[dict] = [
        {
            "chunk_id": str(i),
            "full_text": chunk,
            "file_name": file_name,
            "char_count": len(chunk),
        }
        for i, chunk in enumerate(chunks)
    ]
    collection.upsert(documents=chunks, ids=ids, metadatas=metadatas)
    return {"success": True, "chunks_stored": len(chunks), "file_name": file_name}
