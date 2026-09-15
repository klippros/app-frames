-- Prefer explicit insert/update over upsert in the client. Keep grants aligned so
-- both paths work: ownership still comes from auth.uid() defaults + RLS.

grant insert (user_id) on public.projects to authenticated;
grant insert (user_id) on public.project_frames to authenticated;

grant insert, update on public.projects to authenticated;
grant insert, update on public.project_frames to authenticated;
