from pydantic import BaseModel


class MessageIn(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    conversation_id: str | None = None
    message: str


class ConversationOut(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: str
    sources: list[dict] | None = None
