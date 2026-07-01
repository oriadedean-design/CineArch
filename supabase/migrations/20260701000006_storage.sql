-- ============================================================
-- STORAGE BUCKETS
-- documents: private vault for residency/work docs (per user folder)
-- avatars:   public profile photos
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('documents', 'documents', false, 10485760,   -- 10 MB max
   array['application/pdf','image/jpeg','image/png','image/webp']),
  ('avatars',   'avatars',   true,  2097152,    -- 2 MB max
   array['image/jpeg','image/png','image/webp']);

-- Documents: users can only access their own folder (user_id/*)
create policy "documents: upload own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "documents: read own folder"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "documents: delete own folder"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Avatars: anyone can read, only owner can write
create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars: upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: delete own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
