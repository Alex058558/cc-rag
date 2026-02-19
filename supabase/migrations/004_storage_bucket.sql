-- Create documents storage bucket (private)
-- Run this in Supabase SQL editor or via the dashboard
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Storage RLS: users can only access their own files
create policy "Users can upload own documents"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can read own documents"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own documents"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
