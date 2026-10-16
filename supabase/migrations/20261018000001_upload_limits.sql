-- ============================================================
-- UPLOAD LIMITS (Dean, 2026-10-17)
-- 1 MB per file in the documents bucket, and at most 5 GB of
-- documents per account. The apps shrink photos to fit before
-- uploading; the bucket and the upload policy enforce it.
-- ============================================================

update storage.buckets set file_size_limit = 1048576 where id = 'documents';   -- 1 MB

-- Bytes an account keeps in the documents bucket (its own folder).
create or replace function public.documents_used_bytes(p_user uuid)
returns bigint language sql stable security definer set search_path = public, storage as $$
  select coalesce(sum((o.metadata->>'size')::bigint), 0)
  from storage.objects o
  where o.bucket_id = 'documents' and (storage.foldername(o.name))[1] = p_user::text;
$$;
revoke all on function public.documents_used_bytes(uuid) from public, anon, authenticated;

-- For Account: "X MB of 5 GB used".
create or replace function public.my_documents_usage()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('used_bytes', public.documents_used_bytes((select auth.uid())),
                            'limit_bytes', 5368709120, 'file_limit_bytes', 1048576);
$$;
revoke all on function public.my_documents_usage() from public, anon;
grant execute on function public.my_documents_usage() to authenticated;

-- Uploads need Pro, your own folder, and room for one more file under 5 GB.
drop policy "documents: upload own folder" on storage.objects;
create policy "documents: upload own folder" on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (select auth.uid())::text = (storage.foldername(name))[1]
    and (select public.has_pro())
    and public.documents_used_bytes((select auth.uid())) <= 5368709120 - 1048576
  );
