from supabase import Client


def retrieve_chunks(
    admin_db: Client,
    user_id: str,
    query_embedding: list[float],
    top_k: int = 5,
    min_similarity: float = 0.3,
) -> list[dict]:
    result = admin_db.rpc(
        "match_documents",
        {
            "query_embedding": query_embedding,
            "match_count": top_k,
            "filter_user_id": user_id,
        },
    ).execute()

    chunks = [c for c in result.data if (c.get("similarity") or 0) >= min_similarity]
    if not chunks:
        return []

    doc_ids = list({c["document_id"] for c in chunks})
    docs = admin_db.table("documents").select("id, filename").in_("id", doc_ids).execute()
    filename_map = {d["id"]: d["filename"] for d in docs.data}

    for chunk in chunks:
        chunk["filename"] = filename_map.get(chunk["document_id"], "Unknown")

    return chunks


def has_completed_documents(admin_db: Client, user_id: str) -> bool:
    result = (
        admin_db.table("documents")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("status", "completed")
        .limit(1)
        .execute()
    )
    return bool(result.count and result.count > 0)
