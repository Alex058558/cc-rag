-- Documents table
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  file_type text not null,
  file_size bigint not null,
  storage_path text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  content_hash text,
  chunk_count integer default 0,
  created_at timestamptz not null default now()
);

-- Document chunks with vector embedding
create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  chunk_index integer not null,
  token_count integer,
  embedding vector(768),
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_documents_user_id on documents(user_id);
create index if not exists idx_document_chunks_document_id on document_chunks(document_id);
create index if not exists idx_document_chunks_embedding on document_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Vector search function
create or replace function match_documents(
  query_embedding vector(768),
  match_count integer default 5,
  filter_user_id uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  chunk_index integer,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where (filter_user_id is null or dc.user_id = filter_user_id)
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;
