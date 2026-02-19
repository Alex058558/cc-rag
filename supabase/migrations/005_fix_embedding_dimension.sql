-- Change embedding dimension from 768 to 3072 (text-embedding-004 produces 3072-dim vectors)

-- Drop existing function and index first
drop index if exists idx_document_chunks_embedding;
drop function if exists match_document_chunks;

-- Alter the embedding column
alter table document_chunks alter column embedding type vector(3072);

-- Note: Skipping index creation because Supabase pgvector has 2000-dim limit
-- For small datasets (< 10k chunks), brute force search is fast enough
-- You can add an index later if needed using a lower-dimension model

-- Recreate the search function
create or replace function match_document_chunks(
  query_embedding vector(3072),
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
