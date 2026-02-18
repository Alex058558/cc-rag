from typing import AsyncGenerator
from supabase import Client
from openai import AsyncOpenAI
from backend.config import get_settings


SYSTEM_PROMPT = (
    "你是一個親切又有耐心的 AI 小助手。"
    "用自然、口語化的方式回應，就像朋友聊天一樣。"
    "可以活潑一點，偶爾用一些俏皮的說法。"
    "如果不知道就老實說不知道，不用太正式。"
)


async def get_or_create_conversation(
    db: Client, user_id: str, conversation_id: str | None = None
) -> dict:
    if conversation_id:
        result = (
            db.table("conversations")
            .select("*")
            .eq("id", conversation_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return result.data

    result = (
        db.table("conversations")
        .insert({"user_id": user_id, "title": "New Chat"})
        .execute()
    )
    return result.data[0]


async def save_message(
    db: Client, conversation_id: str, user_id: str, role: str, content: str
) -> dict:
    result = (
        db.table("messages")
        .insert(
            {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "role": role,
                "content": content,
            }
        )
        .execute()
    )
    return result.data[0]


async def get_conversation_messages(
    db: Client, conversation_id: str, user_id: str
) -> list[dict]:
    result = (
        db.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .eq("user_id", user_id)
        .order("created_at")
        .execute()
    )
    return result.data


async def stream_chat_response(
    llm: AsyncOpenAI,
    db: Client,
    conversation_id: str,
    user_id: str,
    user_message: str,
) -> AsyncGenerator[str, None]:
    settings = get_settings()

    await save_message(db, conversation_id, user_id, "user", user_message)

    history = await get_conversation_messages(db, conversation_id, user_id)
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    stream = await llm.chat.completions.create(
        model=settings.gemini_model,
        messages=messages,
        stream=True,
    )

    full_response = ""
    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            full_response += delta.content
            yield delta.content

    await save_message(db, conversation_id, user_id, "assistant", full_response)


async def update_conversation_title(
    llm: AsyncOpenAI, db: Client, conversation_id: str, first_message: str
) -> None:
    settings = get_settings()
    response = await llm.chat.completions.create(
        model=settings.gemini_model,
        messages=[
            {
                "role": "system",
                "content": "Generate a short title (max 6 words) for a conversation that starts with the following message. Reply with ONLY the title, no quotes or punctuation.",
            },
            {"role": "user", "content": first_message},
        ],
    )
    title = response.choices[0].message.content.strip()[:100]
    db.table("conversations").update({"title": title}).eq(
        "id", conversation_id
    ).execute()


async def list_conversations(db: Client, user_id: str) -> list[dict]:
    result = (
        db.table("conversations")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute()
    )
    return result.data


async def delete_conversation(db: Client, conversation_id: str, user_id: str) -> None:
    db.table("conversations").delete().eq("id", conversation_id).eq(
        "user_id", user_id
    ).execute()
