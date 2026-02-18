-- RLS: conversations
alter table conversations enable row level security;

create policy "Users can view own conversations"
  on conversations for select
  using (auth.uid() = user_id);

create policy "Users can create own conversations"
  on conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on conversations for delete
  using (auth.uid() = user_id);

-- RLS: messages
alter table messages enable row level security;

create policy "Users can view own messages"
  on messages for select
  using (auth.uid() = user_id);

create policy "Users can create own messages"
  on messages for insert
  with check (auth.uid() = user_id);

-- RLS: documents
alter table documents enable row level security;

create policy "Users can view own documents"
  on documents for select
  using (auth.uid() = user_id);

create policy "Users can create own documents"
  on documents for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own documents"
  on documents for delete
  using (auth.uid() = user_id);

-- RLS: document_chunks
alter table document_chunks enable row level security;

create policy "Users can view own chunks"
  on document_chunks for select
  using (auth.uid() = user_id);

create policy "Users can create own chunks"
  on document_chunks for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own chunks"
  on document_chunks for delete
  using (auth.uid() = user_id);

-- Storage bucket (run in Supabase dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('documents', 'documents', false);
