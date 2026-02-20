from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    gemini_api_key: str
    gemini_model: str = "gemini-2.0-flash"
    embedding_model: str = "text-embedding-004"
    frontend_url: str = "http://localhost:5173"

    # RAG retrieval
    rag_prefetch_k: int = 15
    rag_top_k_max: int = 5
    rag_top_k_min: int = 1
    rag_min_similarity: float = 0.3
    rag_similarity_drop_ratio: float = 0.6

    model_config = {"env_file": "backend/.env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
