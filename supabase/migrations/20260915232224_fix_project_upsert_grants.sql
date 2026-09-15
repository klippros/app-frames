-- Upserts use onConflict (user_id, id), so PostgREST must be allowed to write user_id.
-- RLS still enforces auth.uid() = user_id on insert/update.

grant insert (user_id) on public.projects to authenticated;
grant insert (user_id) on public.project_frames to authenticated;
