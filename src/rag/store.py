from __future__ import annotations

import os

import chromadb
from chromadb import Collection


def get_client() -> chromadb.ClientAPI:
    persist_dir: str = os.getenv("CHROMA_PERSIST_DIR", "./data/chroma")
    return chromadb.PersistentClient(path=persist_dir)


def get_or_create_collection(client: chromadb.ClientAPI, name: str) -> Collection:
    return client.get_or_create_collection(name=name)


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


def retrieve_bullets(skills: list[str], n_results: int = 3) -> list[str]:
    client = get_client()
    collection = get_or_create_collection(client, "resume_bullets")
    seen: set[str] = set()
    bullets: list[str] = []
    for skill in skills:
        try:
            docs = query_collection(collection, [skill], n_results=n_results)
            for doc in docs[0] if docs else []:
                if doc not in seen:
                    seen.add(doc)
                    bullets.append(doc)
        except Exception:
            pass
    return bullets
