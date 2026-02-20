-- Hybrid search: pgvector + PostgreSQL full-text search (RRF fusion)

alter table document_chunks
  add column if not exists fts tsvector;

create index if not exists idx_document_chunks_fts
  on document_chunks using gin (fts);

create or replace function update_document_chunks_fts()
returns trigger
language plpgsql
as $$
begin
  new.fts := to_tsvector('simple', coalesce(new.content, ''));
  return new;
end;
$$;

drop trigger if exists trg_document_chunks_fts on document_chunks;

create trigger trg_document_chunks_fts
before insert or update of content on document_chunks
for each row
execute function update_document_chunks_fts();

update document_chunks
set fts = to_tsvector('simple', coalesce(content, ''))
where fts is null;

create or replace function hybrid_search(
  query_text text,
  query_embedding vector(768),
  match_count integer default 5,
  filter_user_id uuid default null,
  rrf_k integer default 60,
  full_text_weight float default 1.0,
  semantic_weight float default 1.0,
  full_text_limit integer default 30,
  semantic_limit integer default 30
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  chunk_index integer,
  metadata jsonb,
  similarity float
)
language sql
stable
as $$
  with semantic as (
    select
      dc.id,
      dc.document_id,
      dc.content,
      dc.chunk_index,
      dc.metadata,
      row_number() over (order by dc.embedding <=> query_embedding) as rank_pos
    from document_chunks dc
    where dc.embedding is not null
      and (filter_user_id is null or dc.user_id = filter_user_id)
    order by dc.embedding <=> query_embedding
    limit semantic_limit
  ),
  full_text as (
    select
      dc.id,
      dc.document_id,
      dc.content,
      dc.chunk_index,
      dc.metadata,
      row_number() over (
        order by ts_rank(dc.fts, plainto_tsquery('simple', query_text)) desc, dc.id
      ) as rank_pos
    from document_chunks dc
    where dc.fts @@ plainto_tsquery('simple', query_text)
      and (filter_user_id is null or dc.user_id = filter_user_id)
    order by ts_rank(dc.fts, plainto_tsquery('simple', query_text)) desc, dc.id
    limit full_text_limit
  ),
  fused as (
    select
      coalesce(s.id, f.id) as id,
      coalesce(s.document_id, f.document_id) as document_id,
      coalesce(s.content, f.content) as content,
      coalesce(s.chunk_index, f.chunk_index) as chunk_index,
      coalesce(s.metadata, f.metadata) as metadata,
      coalesce(semantic_weight / (rrf_k + s.rank_pos), 0)
      + coalesce(full_text_weight / (rrf_k + f.rank_pos), 0) as rrf_score
    from semantic s
    full outer join full_text f on s.id = f.id
  )
  select
    id,
    document_id,
    content,
    chunk_index,
    metadata,
    rrf_score as similarity
  from fused
  order by rrf_score desc
  limit match_count;
$$;
