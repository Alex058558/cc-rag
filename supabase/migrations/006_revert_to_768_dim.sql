-- Revert to 768 dimensions to match embedding output
-- text-embedding-004 with dimensions=768 parameter produces 768-dim vectors

-- Drop existing function and index
drop index if exists idx_document_chunks_embedding;
drop function if exists match_document_chunks;

-- Alter the embedding column back to 768
alter table document_chunks alter column embedding type vector(768);

-- Recreate the ivfflat index (works with <= 2000 dimensions)
create index if not exists idx_document_chunks_embedding on document_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Recreate the search function with 768-dim parameter
create or replace function match_document_chunks(
  query_embedding vector(768),
  match_count int default 5,
  filter_user_id uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  chunk_index int,
  similarity float
)
language plpgsql
as $$
begin
  return query (
    select
      dc.id,
      dc.document_id,
      dc.content,
      dc.chunk_index,
      1 - (dc.embedding <=> query_embedding) as similarity
    from document_chunks dc
    where (filter_user_id is null or dc.user_id = filter_user_id)
    order by dc.embedding <=> query_embedding
    limit match_count
  );
end;
$$;
