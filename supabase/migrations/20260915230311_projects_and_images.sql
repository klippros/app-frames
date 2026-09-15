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
  frame_order integer not null check (frame_order >= 0),
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
  unique (user_id, project_id, frame_order),
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
  name,
  revision,
  global_settings,
  client_updated_at
) on public.projects to authenticated;
grant update (
  name,
  revision,
  global_settings,
  client_updated_at
) on public.projects to authenticated;
grant delete on public.projects to authenticated;

grant select on public.project_frames to authenticated;
grant insert (
  id,
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

create or replace function public.set_updated_at()
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

create or replace function public.create_profile_for_new_user()
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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images',
  'project-images',
  false,
  1572864,
  array['image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

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
