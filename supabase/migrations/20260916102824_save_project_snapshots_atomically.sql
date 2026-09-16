-- Commit complete project metadata snapshots with optimistic concurrency.

alter table public.projects
  add column if not exists last_snapshot_id uuid;

alter table public.project_frames
  drop constraint project_frames_user_id_project_id_frame_order_key;

alter table public.project_frames
  add constraint project_frames_user_id_project_id_frame_order_key
  unique (user_id, project_id, frame_order)
  deferrable initially immediate;

create or replace function public.save_project_snapshot(
  p_project_id uuid,
  p_expected_revision bigint,
  p_snapshot_id uuid,
  p_name text,
  p_revision bigint,
  p_global_settings jsonb,
  p_client_updated_at timestamptz,
  p_frames jsonb
)
returns table (
  result_code text,
  server_revision bigint
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  current_revision bigint;
  current_snapshot_id uuid;
  project_exists boolean;
  frame_count integer;
begin
  if caller_id is null then
    raise exception using
      errcode = '42501',
      message = 'authentication_required';
  end if;

  if p_snapshot_id is null
    or p_project_id is null
    or p_revision < 1
    or p_frames is null
    or jsonb_typeof(p_frames) <> 'array'
  then
    raise exception using
      errcode = '22023',
      message = 'invalid_project_snapshot';
  end if;

  frame_count := jsonb_array_length(p_frames);
  if frame_count > 10 then
    raise exception using
      errcode = '23514',
      message = 'project_snapshot_frame_limit';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_frames) as frame
    where jsonb_typeof(frame) <> 'object'
      or not (frame ?& array[
        'id',
        'frame_order',
        'settings',
        'image_path',
        'image_content_type',
        'image_byte_size'
      ])
  ) then
    raise exception using
      errcode = '22023',
      message = 'invalid_project_snapshot_frame';
  end if;

  if (
    select count(distinct (frame ->> 'id')::uuid)
    from jsonb_array_elements(p_frames) as frame
  ) <> frame_count
  or (
    select count(distinct (frame ->> 'frame_order')::integer)
    from jsonb_array_elements(p_frames) as frame
  ) <> frame_count
  then
    raise exception using
      errcode = '22023',
      message = 'invalid_project_snapshot_duplicates';
  end if;

  -- This also serializes creation, where no project row exists to lock yet.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(caller_id::text || ':' || p_project_id::text, 0)
  );

  select projects.revision, projects.last_snapshot_id
  into current_revision, current_snapshot_id
  from public.projects
  where projects.user_id = caller_id
    and projects.id = p_project_id
  for update;
  project_exists := found;

  -- A replay after a client crash is successful without applying the snapshot twice.
  if project_exists and current_snapshot_id = p_snapshot_id then
    return query select 'applied'::text, current_revision;
    return;
  end if;

  if (project_exists and p_expected_revision is distinct from current_revision)
    or (not project_exists and p_expected_revision is not null)
  then
    return query select 'revision_conflict'::text, current_revision;
    return;
  end if;

  if project_exists and p_revision <= current_revision then
    raise exception using
      errcode = '22023',
      message = 'project_snapshot_revision_must_advance';
  end if;

  if exists (
    select 1
    from public.project_frames
    join jsonb_array_elements(p_frames) as frame
      on project_frames.id = (frame ->> 'id')::uuid
    where project_frames.user_id = caller_id
      and project_frames.project_id <> p_project_id
  ) then
    raise exception using
      errcode = '23514',
      message = 'project_snapshot_frame_belongs_to_another_project';
  end if;

  if project_exists then
    update public.projects
    set
      name = p_name,
      revision = p_revision,
      global_settings = p_global_settings,
      client_updated_at = p_client_updated_at,
      last_snapshot_id = p_snapshot_id
    where user_id = caller_id
      and id = p_project_id;
  else
    insert into public.projects (
      id,
      user_id,
      name,
      revision,
      global_settings,
      client_updated_at,
      last_snapshot_id
    )
    values (
      p_project_id,
      caller_id,
      p_name,
      p_revision,
      p_global_settings,
      p_client_updated_at,
      p_snapshot_id
    );
  end if;

  delete from public.project_frames
  where project_frames.user_id = caller_id
    and project_frames.project_id = p_project_id
    and not exists (
      select 1
      from jsonb_array_elements(p_frames) as frame
      where (frame ->> 'id')::uuid = project_frames.id
    );

  -- Defer the final-order uniqueness check so swaps never collide transiently.
  set constraints all deferred;

  insert into public.project_frames (
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
  )
  select
    frame.id,
    caller_id,
    p_project_id,
    frame.frame_order,
    frame.settings,
    frame.image_path,
    frame.image_content_type,
    frame.image_byte_size,
    frame.image_width,
    frame.image_height,
    frame.image_content_hash
  from jsonb_to_recordset(p_frames) as frame (
    id uuid,
    frame_order integer,
    settings jsonb,
    image_path text,
    image_content_type text,
    image_byte_size integer,
    image_width integer,
    image_height integer,
    image_content_hash text
  )
  on conflict (user_id, id) do update
  set
    frame_order = excluded.frame_order,
    settings = excluded.settings,
    image_path = excluded.image_path,
    image_content_type = excluded.image_content_type,
    image_byte_size = excluded.image_byte_size,
    image_width = excluded.image_width,
    image_height = excluded.image_height,
    image_content_hash = excluded.image_content_hash;

  set constraints all immediate;

  return query select 'applied'::text, p_revision;
end;
$$;

revoke all on function public.save_project_snapshot(
  uuid,
  bigint,
  uuid,
  text,
  bigint,
  jsonb,
  timestamptz,
  jsonb
) from public, anon;

grant execute on function public.save_project_snapshot(
  uuid,
  bigint,
  uuid,
  text,
  bigint,
  jsonb,
  timestamptz,
  jsonb
) to authenticated;
