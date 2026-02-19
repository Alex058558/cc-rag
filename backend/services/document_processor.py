import hashlib
import os
import tempfile
from pathlib import Path

_CHUNK_SIZE = 1500  # characters
_CHUNK_OVERLAP = 150


def compute_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def parse_document(file_bytes: bytes, filename: str) -> str:
    """Parse document to markdown text using Docling."""
    from docling.document_converter import DocumentConverter

    suffix = Path(filename).suffix.lower() or ".bin"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(file_bytes)
        tmp_path = f.name

    try:
        converter = DocumentConverter()
        result = converter.convert(tmp_path)
        return result.document.export_to_markdown()
    finally:
        os.unlink(tmp_path)


def chunk_text(text: str) -> list[dict]:
    """Split text into overlapping chunks by paragraph boundaries."""
    segments = [s.strip() for s in text.split("\n\n") if s.strip()]

    chunks: list[dict] = []
    current = ""
    idx = 0

    for segment in segments:
        if len(current) + len(segment) + 2 <= _CHUNK_SIZE:
            current = (current + "\n\n" + segment).strip() if current else segment
        else:
            if current:
                chunks.append(_make_chunk(current, idx))
                idx += 1
                tail = current[-_CHUNK_OVERLAP:] if len(current) > _CHUNK_OVERLAP else current
                current = (tail + "\n\n" + segment).strip()
            else:
                # Segment alone exceeds limit — split word by word
                for word in segment.split(" "):
                    if len(current) + len(word) + 1 <= _CHUNK_SIZE:
                        current = (current + " " + word).strip() if current else word
                    else:
                        if current:
                            chunks.append(_make_chunk(current, idx))
                            idx += 1
                            tail = current[-_CHUNK_OVERLAP:] if len(current) > _CHUNK_OVERLAP else current
                            current = (tail + " " + word).strip()
                        else:
                            current = word

    if current:
        chunks.append(_make_chunk(current, idx))

    return chunks


def _make_chunk(content: str, index: int) -> dict:
    return {
        "content": content,
        "chunk_index": index,
        "token_count": len(content) // 4,
    }
