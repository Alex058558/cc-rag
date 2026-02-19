import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

logger = logging.getLogger(__name__)

from backend.auth.middleware import AuthUser, get_current_user
from backend.database import get_supabase_admin, get_supabase_client
from backend.services.document_processor import chunk_text, compute_hash, parse_document
from backend.services.embedding import embed_texts
from backend.services.record_manager import find_duplicate, insert_chunks

router = APIRouter(tags=["documents"])

_executor = ThreadPoolExecutor()

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
    "text/html",
}


class DocumentOut(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    status: str
    chunk_count: int
    created_at: str


async def _process_document(document_id: str, file_bytes: bytes, filename: str, user_id: str) -> None:
    admin_db = get_supabase_admin()
    try:
        logger.info(f"[{document_id}] Starting document processing")
        admin_db.table("documents").update({"status": "processing"}).eq("id", document_id).execute()

        # Docling is synchronous; run in thread pool to avoid blocking the event loop
        loop = asyncio.get_running_loop()
        text = await loop.run_in_executor(_executor, parse_document, file_bytes, filename)
        logger.info(f"[{document_id}] Parsed text length: {len(text)}")

        chunks = chunk_text(text)
        logger.info(f"[{document_id}] Created {len(chunks)} chunks")
        if not chunks:
            admin_db.table("documents").update({"status": "failed"}).eq("id", document_id).execute()
            return

        texts = [c["content"] for c in chunks]
        embeddings = await embed_texts(texts)
        logger.info(f"[{document_id}] Generated {len(embeddings)} embeddings")

        chunk_records = [
            {
                "document_id": document_id,
                "user_id": user_id,
                "content": chunk["content"],
                "chunk_index": chunk["chunk_index"],
                "token_count": chunk["token_count"],
                "embedding": embedding,
                "metadata": {},
            }
            for chunk, embedding in zip(chunks, embeddings)
        ]
        insert_chunks(admin_db, chunk_records)
        logger.info(f"[{document_id}] Inserted {len(chunk_records)} chunks to DB")

        admin_db.table("documents").update(
            {"status": "completed", "chunk_count": len(chunks)}
        ).eq("id", document_id).execute()
        logger.info(f"[{document_id}] Processing completed successfully")

    except Exception as e:
        logger.exception(f"[{document_id}] Processing failed: {e}")
        admin_db.table("documents").update({"status": "failed"}).eq("id", document_id).execute()
        raise


@router.post("/documents", response_model=DocumentOut)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: AuthUser = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}")

    file_bytes = await file.read()
    content_hash = compute_hash(file_bytes)

    db = get_supabase_client(user.token)
    admin_db = get_supabase_admin()

    existing = find_duplicate(db, user.id, content_hash)
    if existing:
        return existing

    # Use hash + extension as the storage key — original filename stays in DB only.
    # Supabase Storage rejects non-ASCII characters in object keys.
    suffix = Path(file.filename).suffix.lower() if file.filename else ""
    storage_path = f"{user.id}/{content_hash}{suffix}"
    admin_db.storage.from_("documents").upload(
        storage_path,
        file_bytes,
        file_options={"content-type": file.content_type},
    )

    result = (
        db.table("documents")
        .insert(
            {
                "user_id": user.id,
                "filename": file.filename,
                "file_type": file.content_type,
                "file_size": len(file_bytes),
                "storage_path": storage_path,
                "status": "pending",
                "content_hash": content_hash,
                "chunk_count": 0,
            }
        )
        .execute()
    )
    doc = result.data[0]

    background_tasks.add_task(_process_document, doc["id"], file_bytes, file.filename, user.id)
    return doc


@router.get("/documents", response_model=list[DocumentOut])
async def list_documents(user: AuthUser = Depends(get_current_user)):
    db = get_supabase_client(user.token)
    result = (
        db.table("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    user: AuthUser = Depends(get_current_user),
):
    db = get_supabase_client(user.token)
    result = (
        db.table("documents")
        .select("storage_path")
        .eq("id", document_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Document not found")

    storage_path = result.data[0]["storage_path"]
    admin_db = get_supabase_admin()
    admin_db.storage.from_("documents").remove([storage_path])
    admin_db.table("documents").delete().eq("id", document_id).execute()

    return {"ok": True}
