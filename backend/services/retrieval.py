import logging
import re

from supabase import Client

from backend.config import get_settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def retrieve_chunks(
    admin_db: Client,
    user_id: str,
    query_embedding: list[float],
    query_text: str = "",
) -> list[dict]:
    settings = get_settings()

    # Stage 1: prefetch — 多撈一些候選
    candidates = _prefetch(
        admin_db,
        user_id,
        query_embedding,
        prefetch_k=settings.rag_prefetch_k,
        min_similarity=settings.rag_min_similarity,
    )
    if not candidates:
        logger.info("[retrieval] no candidates above min_similarity=%.2f", settings.rag_min_similarity)
        return []

    logger.info(
        "[retrieval] prefetch: %d candidates (sim range %.3f ~ %.3f)",
        len(candidates),
        candidates[-1].get("similarity", 0),
        candidates[0].get("similarity", 0),
    )

    # Stage 2: heuristic rerank
    if query_text:
        candidates = heuristic_rerank(candidates, query_text)

    # Stage 3: 動態裁切
    results = _dynamic_topk(
        candidates,
        top_k_max=settings.rag_top_k_max,
        top_k_min=settings.rag_top_k_min,
        drop_ratio=settings.rag_similarity_drop_ratio,
    )

    # 補上 filename
    _attach_filenames(admin_db, results)

    logger.info("[retrieval] final: %d chunks returned", len(results))
    return results


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


# ---------------------------------------------------------------------------
# Stage 1: Prefetch
# ---------------------------------------------------------------------------

def _prefetch(
    admin_db: Client,
    user_id: str,
    query_embedding: list[float],
    prefetch_k: int,
    min_similarity: float,
) -> list[dict]:
    result = admin_db.rpc(
        "match_documents",
        {
            "query_embedding": query_embedding,
            "match_count": prefetch_k,
            "filter_user_id": user_id,
        },
    ).execute()

    return [c for c in result.data if (c.get("similarity") or 0) >= min_similarity]


# ---------------------------------------------------------------------------
# Stage 2: Heuristic Rerank
# ---------------------------------------------------------------------------

def heuristic_rerank(chunks: list[dict], query_text: str) -> list[dict]:
    keywords = _extract_keywords(query_text)
    if not keywords:
        return chunks

    scored = []
    for chunk in chunks:
        sim_score = chunk.get("similarity", 0)
        content_lower = (chunk.get("content") or "").lower()

        # 關鍵詞覆蓋率：有多少比例的 keywords 出現在 chunk 裡
        hits = sum(1 for kw in keywords if kw in content_lower)
        keyword_coverage = hits / len(keywords)

        # 結構加分：chunk 開頭含標題格式（markdown heading）通常是段落重點
        structure_bonus = 0.05 if re.match(r"^#{1,3}\s", chunk.get("content", "")) else 0

        # 綜合分數：vector similarity 為主，keyword + structure 為輔
        final_score = sim_score * 0.7 + keyword_coverage * 0.25 + structure_bonus
        scored.append((final_score, chunk))

    scored.sort(key=lambda x: x[0], reverse=True)

    logger.info(
        "[rerank] keyword=%s, score range: %.3f ~ %.3f",
        keywords,
        scored[-1][0] if scored else 0,
        scored[0][0] if scored else 0,
    )

    return [chunk for _, chunk in scored]


def _extract_keywords(text: str) -> list[str]:
    # 簡易斷詞：去掉常見停用詞，保留 2 字以上的 token
    stop_words = {
        "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都",
        "一", "一個", "上", "也", "很", "到", "說", "要", "去", "你",
        "會", "著", "沒有", "看", "好", "自己", "這", "他", "她", "它",
        "what", "is", "the", "a", "an", "in", "on", "at", "to", "for",
        "of", "and", "or", "how", "can", "do", "does", "this", "that",
        "with", "from", "about", "which", "who", "where", "when", "why",
    }
    tokens = re.split(r"[\s,;?!。，；？！]+", text.lower())
    return [t for t in tokens if len(t) >= 2 and t not in stop_words]


# ---------------------------------------------------------------------------
# Stage 3: Dynamic Top-K
# ---------------------------------------------------------------------------

def _dynamic_topk(
    chunks: list[dict],
    top_k_max: int,
    top_k_min: int,
    drop_ratio: float,
) -> list[dict]:
    if not chunks:
        return []

    # 至少取 top_k_min，最多 top_k_max
    results = chunks[:top_k_min]

    if len(chunks) > top_k_min:
        top_sim = chunks[0].get("similarity") or 0
        threshold = top_sim * drop_ratio

        for chunk in chunks[top_k_min:top_k_max]:
            sim = chunk.get("similarity") or 0
            if sim >= threshold:
                results.append(chunk)
            else:
                logger.info(
                    "[dynamic_topk] cut at #%d: sim=%.3f < threshold=%.3f",
                    len(results), sim, threshold,
                )
                break

    return results


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _attach_filenames(admin_db: Client, chunks: list[dict]) -> None:
    if not chunks:
        return
    doc_ids = list({c["document_id"] for c in chunks})
    docs = admin_db.table("documents").select("id, filename").in_("id", doc_ids).execute()
    filename_map = {d["id"]: d["filename"] for d in docs.data}
    for chunk in chunks:
        chunk["filename"] = filename_map.get(chunk["document_id"], "Unknown")
