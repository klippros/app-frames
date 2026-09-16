-- The snapshot RPC is security-invoker, so callers need the table privileges used
-- inside the transaction. Remove the broad grants left by the former direct
-- project/frame upsert path and grant only the columns the RPC writes.

revoke insert, update on public.projects from authenticated;
revoke insert, update on public.project_frames from authenticated;

grant insert (
  id,
  user_id,
  name,
  revision,
  global_settings,
  client_updated_at,
  last_snapshot_id
) on public.projects to authenticated;

grant update (
  name,
  revision,
  global_settings,
  client_updated_at,
  last_snapshot_id
) on public.projects to authenticated;

grant insert (
  id,
  user_id,
  project_id,
  frame_order,
  settings,
  image_path,
  image_content_type,
  image_byte_size,
  image_width,
  image_height,
  image_content_hash
) on public.project_frames to authenticated;

grant update (
  frame_order,
  settings,
  image_path,
  image_content_type,
  image_byte_size,
  image_width,
  image_height,
  image_content_hash
) on public.project_frames to authenticated;
