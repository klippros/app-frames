-- Cap each user at 3 projects and each project at 10 frames.

create or replace function public.enforce_max_projects_per_user()
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

revoke all on function public.enforce_max_projects_per_user() from public, anon, authenticated;

create trigger enforce_max_projects_per_user
  before insert on public.projects
  for each row execute function public.enforce_max_projects_per_user();

alter table public.project_frames
  drop constraint if exists project_frames_frame_order_check;

alter table public.project_frames
  add constraint project_frames_frame_order_check
  check (frame_order between 0 and 9);
