from supabase import Client

_CHUNK_BATCH = 50


def find_duplicate(db: Client, user_id: str, content_hash: str) -> dict | None:
    result = (
        db.table("documents")
        .select("*")
        .eq("user_id", user_id)
        .eq("content_hash", content_hash)
        .execute()
    )
    return result.data[0] if result.data else None


def insert_chunks(admin_db: Client, chunks: list[dict]) -> None:
    for i in range(0, len(chunks), _CHUNK_BATCH):
        admin_db.table("document_chunks").insert(chunks[i : i + _CHUNK_BATCH]).execute()
