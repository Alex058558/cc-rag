import json
import logging
from typing import AsyncGenerator

from openai import AsyncOpenAI

from backend.agent.tools import RETRIEVE_TOOL
from backend.config import get_settings
from backend.database import get_supabase_admin
from backend.services.embedding import embed_texts
from backend.services.retrieval import has_completed_documents, retrieve_chunks

logger = logging.getLogger(__name__)

_RAG_SYSTEM = (
    "你是一個親切又有耐心的 AI 小助手。"
    "用自然、口語化的方式回應，就像朋友聊天一樣。"
    "可以活潑一點，偶爾用一些俏皮的說法。"
    "如果不知道就老實說不知道，不用太正式。\n\n"
    "你可以存取使用者的知識庫。"
    "當問題可能需要文件資料來回答時，請使用 retrieve_documents 工具搜尋相關內容。\n\n"
    "引用規則（務必嚴格遵守）：\n"
    "- 只使用工具回傳的 index 編號（1, 2, 3...）來標註引用，不要使用原文獻中的編號。\n"
    "- 格式必須是 [1][2]，每個編號各自獨立方括號，禁止用逗號合併如 [1, 2]。\n"
    "- 範例：「鋼琴訓練能提升認知功能[1]，同時也有助於情緒調節[2]」\n"
    "- 如果沒有相關資料，或問題與文件無關，直接回答即可，不要加引用。"
)

_PLAIN_SYSTEM = (
    "你是一個親切又有耐心的 AI 小助手。"
    "用自然、口語化的方式回應，就像朋友聊天一樣。"
    "可以活潑一點，偶爾用一些俏皮的說法。"
    "如果不知道就老實說不知道，不用太正式。"
)


async def stream_agent_response(
    llm: AsyncOpenAI,
    user_id: str,
    history: list[dict],
) -> AsyncGenerator[dict, None]:
    """
    Yield events:
      {"type": "sources", "sources": [...]}
      {"type": "token",   "token": "..."}
    history should include the current user message at the end.
    """
    settings = get_settings()
    admin_db = get_supabase_admin()
    use_rag = has_completed_documents(admin_db, user_id)

    messages = [{"role": "system", "content": _RAG_SYSTEM if use_rag else _PLAIN_SYSTEM}]
    messages += [{"role": m["role"], "content": m["content"]} for m in history]

    if not use_rag:
        async for token in _stream(llm, settings.gemini_model, messages):
            yield {"type": "token", "token": token}
        return

    # --- Tool calling round (non-streaming) ---
    response = await llm.chat.completions.create(
        model=settings.gemini_model,
        messages=messages,
        tools=[RETRIEVE_TOOL],
        tool_choice={"type": "function", "function": {"name": "retrieve_documents"}},
    )
    choice = response.choices[0]

    if not choice.message.tool_calls:
        # LLM decided not to retrieve — emit its response directly
        content = choice.message.content or ""
        yield {"type": "token", "token": content}
        return

    # --- Execute retrieve_documents ---
    tool_call = choice.message.tool_calls[0]
    args = json.loads(tool_call.function.arguments)
    query = args.get("query", "")
    logger.info("retrieve_documents query: %s", query)

    embeddings = await embed_texts([query])
    chunks = retrieve_chunks(admin_db, user_id, embeddings[0], query_text=query)
    logger.info("Retrieved %d chunks after rerank + dynamic topk", len(chunks))

    if chunks:
        yield {"type": "sources", "sources": chunks}

    # Add index to each chunk so LLM knows [1], [2], etc. correspond to sources
    tool_content = json.dumps(
        [{"index": i + 1, "filename": c["filename"], "content": c["content"]} for i, c in enumerate(chunks)],
        ensure_ascii=False,
    )

    # Append assistant turn + tool result
    messages.append({
        "role": "assistant",
        "content": choice.message.content,
        "tool_calls": [
            {
                "id": tool_call.id,
                "type": "function",
                "function": {
                    "name": tool_call.function.name,
                    "arguments": tool_call.function.arguments,
                },
            }
        ],
    })
    messages.append({
        "role": "tool",
        "tool_call_id": tool_call.id,
        "content": tool_content,
    })

    # --- Final streaming response ---
    async for token in _stream(llm, settings.gemini_model, messages):
        yield {"type": "token", "token": token}


async def _stream(llm: AsyncOpenAI, model: str, messages: list[dict]):
    stream = await llm.chat.completions.create(
        model=model,
        messages=messages,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content
