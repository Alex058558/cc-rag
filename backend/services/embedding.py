from openai import AsyncOpenAI
from backend.config import get_settings

_BATCH_SIZE = 20

# text-embedding-004 supports dimensions parameter (256-3072)
# Using 768 to stay within pgvector index limit (2000 dim max)
_EMBEDDING_DIMENSIONS = 768


async def embed_texts(texts: list[str]) -> list[list[float]]:
    settings = get_settings()
    client = AsyncOpenAI(
        api_key=settings.gemini_api_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )

    all_embeddings: list[list[float]] = []
    for i in range(0, len(texts), _BATCH_SIZE):
        batch = texts[i : i + _BATCH_SIZE]
        response = await client.embeddings.create(
            model=settings.embedding_model,
            input=batch,
            dimensions=_EMBEDDING_DIMENSIONS,  # Downscale to 768-dim for pgvector index compatibility
        )
        # Gemini's OpenAI-compatible API returns index=None; rely on response order
        all_embeddings.extend(item.embedding for item in response.data)

    return all_embeddings
