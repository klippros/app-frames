-- Profiles, private projects, frame metadata, and private image storage.

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  revision bigint not null default 1 check (revision >= 1),
  global_settings jsonb not null default '{"version":1}'::jsonb,
  last_snapshot_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_updated_at timestamptz not null,
  primary key (user_id, id),
  constraint projects_global_settings_has_version check (
    (global_settings ? 'version')
    and jsonb_typeof(global_settings -> 'version') = 'number'
  )
);

create table public.project_frames (
  id uuid not null,
  project_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  frame_order integer not null check (frame_order between 0 and 9),
  settings jsonb not null default '{"version":1}'::jsonb,
  image_path text not null,
  image_content_type text not null check (image_content_type = 'image/webp'),
  image_byte_size integer not null check (image_byte_size > 0 and image_byte_size <= 1572864),
  image_width integer check (image_width is null or image_width > 0),
  image_height integer check (image_height is null or image_height > 0),
  image_content_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  unique (user_id, project_id, frame_order) deferrable initially immediate,
  constraint project_frames_settings_has_version check (
    (settings ? 'version')
    and jsonb_typeof(settings -> 'version') = 'number'
  ),
  constraint project_frames_image_path_owner_scoped check (
    image_path like (user_id::text || '/%')
  ),
  constraint project_frames_project_fk
    foreign key (user_id, project_id)
    references public.projects (user_id, id)
    on delete cascade
);

create index projects_user_updated_at_idx
  on public.projects (user_id, updated_at desc);

create index project_frames_user_project_order_idx
  on public.project_frames (user_id, project_id, frame_order);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_frames enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.projects from anon, authenticated;
revoke all on public.project_frames from anon, authenticated;

grant usage on schema public to authenticated;

grant select on public.profiles to authenticated;
grant insert (user_id, display_name) on public.profiles to authenticated;
grant update (display_name, updated_at) on public.profiles to authenticated;

grant select on public.projects to authenticated;
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
grant delete on public.projects to authenticated;

grant select on public.project_frames to authenticated;
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
grant delete on public.project_frames to authenticated;

create policy "Users can read their profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can read their projects"
  on public.projects
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their projects"
  on public.projects
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their projects"
  on public.projects
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their projects"
  on public.projects
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their project frames"
  on public.project_frames
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their project frames"
  on public.project_frames
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their project frames"
  on public.project_frames
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their project frames"
  on public.project_frames
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger set_project_frames_updated_at
  before update on public.project_frames
  for each row execute function public.set_updated_at();

create function public.enforce_max_projects_per_user()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  project_count integer;
begin
  -- Serialize inserts per user so concurrent clients cannot race past the cap.
  perform pg_advisory_xact_lock(hashtext(new.user_id::text));

  select count(*)::integer
  into project_count
  from public.projects
  where user_id = new.user_id;

  if project_count >= 3 then
    raise exception 'A user can have at most 3 projects'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_max_projects_per_user()
  from public, anon, authenticated;

create trigger enforce_max_projects_per_user
  before insert on public.projects
  for each row execute function public.enforce_max_projects_per_user();

create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
begin
  profile_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'You'
  );

  insert into public.profiles (user_id, display_name)
  values (new.id, left(profile_name, 100))
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

create function public.save_project_snapshot(
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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images',
  'project-images',
  false,
  1572864,
  array['image/webp']
);

create policy "Users can read own project images"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can upload own project images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can update own project images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can delete own project images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
