import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from backend.auth.middleware import AuthUser, get_current_user
from backend.database import get_supabase_client
from backend.llm.client import get_llm_client
from backend.llm.schemas import ChatRequest, ConversationOut, MessageOut
from backend.services.chat import (
    get_or_create_conversation,
    stream_chat_response,
    get_conversation_messages,
    list_conversations,
    delete_conversation,
    update_conversation_title,
)

router = APIRouter(tags=["chat"])


@router.get("/conversations", response_model=list[ConversationOut])
async def get_conversations(user: AuthUser = Depends(get_current_user)):
    db = get_supabase_client(user.token)
    return await list_conversations(db, user.id)


@router.post("/conversations", response_model=ConversationOut)
async def create_conversation(user: AuthUser = Depends(get_current_user)):
    db = get_supabase_client(user.token)
    return await get_or_create_conversation(db, user.id)


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
async def get_messages(
    conversation_id: str, user: AuthUser = Depends(get_current_user)
):
    db = get_supabase_client(user.token)
    return await get_conversation_messages(db, conversation_id, user.id)


@router.delete("/conversations/{conversation_id}")
async def remove_conversation(
    conversation_id: str, user: AuthUser = Depends(get_current_user)
):
    db = get_supabase_client(user.token)
    await delete_conversation(db, conversation_id, user.id)
    return {"ok": True}


@router.post("/chat")
async def chat(body: ChatRequest, user: AuthUser = Depends(get_current_user)):
    db = get_supabase_client(user.token)
    llm = get_llm_client()

    conversation = await get_or_create_conversation(db, user.id, body.conversation_id)
    conversation_id = conversation["id"]

    is_first = not body.conversation_id

    async def event_stream():
        yield f"data: {json.dumps({'conversation_id': conversation_id})}\n\n"

        async for token in stream_chat_response(
            llm, db, conversation_id, user.id, body.message
        ):
            yield f"data: {json.dumps({'token': token})}\n\n"

        if is_first:
            await update_conversation_title(llm, db, conversation_id, body.message)

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
