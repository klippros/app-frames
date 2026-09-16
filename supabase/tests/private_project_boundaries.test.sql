begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(45);

insert into auth.users (id, email)
values
  ('10000000-0000-4000-8000-000000000001', 'phase6-a@example.test'),
  ('20000000-0000-4000-8000-000000000002', 'phase6-b@example.test');

insert into public.projects (id, user_id, name, revision, client_updated_at)
values
  (
    'a0000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'A seed',
    1,
    now()
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    'B seed',
    1,
    now()
  );

insert into public.project_frames (
  id,
  project_id,
  user_id,
  frame_order,
  settings,
  image_path,
  image_content_type,
  image_byte_size
)
values
  (
    'a1000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    0,
    '{"version":1}',
    '10000000-0000-4000-8000-000000000001/a/frame.webp',
    'image/webp',
    1
  ),
  (
    'b1000000-0000-4000-8000-000000000002',
    'b0000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    0,
    '{"version":1}',
    '20000000-0000-4000-8000-000000000002/b/frame.webp',
    'image/webp',
    1
  );

insert into storage.objects (bucket_id, name, owner_id, metadata)
values
  (
    'project-images',
    '10000000-0000-4000-8000-000000000001/a/frame.webp',
    '10000000-0000-4000-8000-000000000001',
    '{"mimetype":"image/webp","size":1}'
  ),
  (
    'project-images',
    '20000000-0000-4000-8000-000000000002/b/frame.webp',
    '20000000-0000-4000-8000-000000000002',
    '{"mimetype":"image/webp","size":1}'
  );

select ok(
  not has_table_privilege('authenticated', 'public.projects', 'INSERT'),
  'authenticated has no broad project INSERT grant'
);
select ok(
  has_column_privilege('authenticated', 'public.projects', 'last_snapshot_id', 'INSERT'),
  'snapshot callers can insert the project snapshot id'
);
select ok(
  not has_column_privilege('authenticated', 'public.projects', 'created_at', 'UPDATE'),
  'snapshot callers cannot update server timestamps directly'
);
select ok(
  not has_column_privilege('authenticated', 'public.project_frames', 'user_id', 'UPDATE'),
  'snapshot callers cannot reassign frame ownership'
);

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';

select results_eq(
  $$select name from public.projects order by name$$,
  $$values ('A seed'::text)$$,
  'project SELECT is owner-isolated'
);
select lives_ok(
  $$insert into public.projects (id, name, client_updated_at)
    values ('a0000000-0000-4000-8000-000000000003', 'A inserted', now())$$,
  'project INSERT defaults to the authenticated owner'
);
select throws_ok(
  $$insert into public.projects (id, user_id, name, client_updated_at)
    values (
      'a0000000-0000-4000-8000-000000000004',
      '20000000-0000-4000-8000-000000000002',
      'spoofed',
      now()
    )$$,
  '42501',
  null,
  'project INSERT rejects a spoofed owner'
);
select results_eq(
  $$update public.projects set name = 'A updated'
    where id = 'a0000000-0000-4000-8000-000000000001'
    returning name$$,
  $$values ('A updated'::text)$$,
  'project UPDATE permits the owner'
);
select is_empty(
  $$update public.projects set name = 'stolen'
    where id = 'b0000000-0000-4000-8000-000000000002'
    returning id$$,
  'project UPDATE hides another owner row'
);
select is_empty(
  $$delete from public.projects
    where id = 'b0000000-0000-4000-8000-000000000002'
    returning id$$,
  'project DELETE hides another owner row'
);
select results_eq(
  $$delete from public.projects
    where id = 'a0000000-0000-4000-8000-000000000003'
    returning name$$,
  $$values ('A inserted'::text)$$,
  'project DELETE permits the owner'
);

select results_eq(
  $$select id from public.project_frames order by id$$,
  $$values ('a1000000-0000-4000-8000-000000000001'::uuid)$$,
  'frame SELECT is owner-isolated'
);
select lives_ok(
  $$insert into public.project_frames (
      id, project_id, frame_order, settings, image_path, image_content_type, image_byte_size
    ) values (
      'a1000000-0000-4000-8000-000000000003',
      'a0000000-0000-4000-8000-000000000001',
      1,
      '{"version":1}',
      '10000000-0000-4000-8000-000000000001/a/second.webp',
      'image/webp',
      1
    )$$,
  'frame INSERT defaults to the authenticated owner'
);
select throws_ok(
  $$insert into public.project_frames (
      id, project_id, user_id, frame_order, settings, image_path,
      image_content_type, image_byte_size
    ) values (
      'a1000000-0000-4000-8000-000000000004',
      'b0000000-0000-4000-8000-000000000002',
      '20000000-0000-4000-8000-000000000002',
      1,
      '{"version":1}',
      '20000000-0000-4000-8000-000000000002/b/spoof.webp',
      'image/webp',
      1
    )$$,
  '42501',
  null,
  'frame INSERT rejects a spoofed owner'
);
select throws_ok(
  $$insert into public.project_frames (
      id, project_id, frame_order, settings, image_path, image_content_type, image_byte_size
    ) values (
      'a1000000-0000-4000-8000-000000000005',
      'a0000000-0000-4000-8000-000000000001',
      2,
      '{"version":1}',
      '20000000-0000-4000-8000-000000000002/a/spoof.webp',
      'image/webp',
      1
    )$$,
  '23514',
  null,
  'frame metadata rejects an owner-path spoof'
);
select results_eq(
  $$update public.project_frames set settings = '{"version":1,"title":"updated"}'
    where id = 'a1000000-0000-4000-8000-000000000001'
    returning settings ->> 'title'$$,
  $$values ('updated'::text)$$,
  'frame UPDATE permits the owner'
);
select is_empty(
  $$update public.project_frames set settings = '{"version":1,"title":"stolen"}'
    where id = 'b1000000-0000-4000-8000-000000000002'
    returning id$$,
  'frame UPDATE hides another owner row'
);
select is_empty(
  $$delete from public.project_frames
    where id = 'b1000000-0000-4000-8000-000000000002'
    returning id$$,
  'frame DELETE hides another owner row'
);
select results_eq(
  $$delete from public.project_frames
    where id = 'a1000000-0000-4000-8000-000000000003'
    returning id$$,
  $$values ('a1000000-0000-4000-8000-000000000003'::uuid)$$,
  'frame DELETE permits the owner'
);

select results_eq(
  $$select name from storage.objects
    where bucket_id = 'project-images'
    order by name$$,
  $$values ('10000000-0000-4000-8000-000000000001/a/frame.webp'::text)$$,
  'storage list and read expose only owner-prefixed objects'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id, metadata)
    values (
      'project-images',
      '10000000-0000-4000-8000-000000000001/a/new.webp',
      '10000000-0000-4000-8000-000000000001',
      '{"mimetype":"image/webp","size":1}'
    )$$,
  'storage write permits the owner prefix'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id, metadata)
    values (
      'project-images',
      '20000000-0000-4000-8000-000000000002/a/spoof.webp',
      '10000000-0000-4000-8000-000000000001',
      '{"mimetype":"image/webp","size":1}'
    )$$,
  '42501',
  null,
  'storage write rejects an owner-path spoof'
);
select is_empty(
  $$update storage.objects set metadata = '{"mimetype":"image/webp","size":2}'
    where name = '20000000-0000-4000-8000-000000000002/b/frame.webp'
    returning name$$,
  'storage update hides another owner object'
);
reset role;
set local session_replication_role = replica;
set local role authenticated;
select is_empty(
  $$delete from storage.objects
    where name = '20000000-0000-4000-8000-000000000002/b/frame.webp'
    returning name$$,
  'storage delete hides another owner object'
);
select results_eq(
  $$delete from storage.objects
    where name = '10000000-0000-4000-8000-000000000001/a/new.webp'
    returning name$$,
  $$values ('10000000-0000-4000-8000-000000000001/a/new.webp'::text)$$,
  'storage delete permits the owner'
);
reset role;
set local session_replication_role = origin;
select results_eq(
  $$select file_size_limit from storage.buckets where id = 'project-images'$$,
  $$values (1572864::bigint)$$,
  'the local storage API enforces the 1.5 MiB bucket limit'
);
select results_eq(
  $$select allowed_mime_types from storage.buckets where id = 'project-images'$$,
  $$values (array['image/webp']::text[])$$,
  'the local storage API only permits image/webp'
);
select results_eq(
  $$select public from storage.buckets where id = 'project-images'$$,
  $$values (false)$$,
  'the project image bucket is private'
);

set local role authenticated;
select lives_ok(
  $$insert into public.projects (id, name, client_updated_at)
    values ('a0000000-0000-4000-8000-000000000005', 'A second', now())$$,
  'the third project is allowed'
);
select lives_ok(
  $$insert into public.projects (id, name, client_updated_at)
    values ('a0000000-0000-4000-8000-000000000006', 'A third', now())$$,
  'the project quota allows three owner projects'
);
select throws_ok(
  $$insert into public.projects (id, name, client_updated_at)
    values ('a0000000-0000-4000-8000-000000000007', 'A fourth', now())$$,
  '23514',
  'A user can have at most 3 projects',
  'the project quota rejects a fourth project'
);

insert into public.project_frames (
  id, project_id, frame_order, settings, image_path, image_content_type, image_byte_size
)
select
  ('a2000000-0000-4000-8000-' || lpad(frame_order::text, 12, '0'))::uuid,
  'a0000000-0000-4000-8000-000000000005',
  frame_order,
  '{"version":1}',
  '10000000-0000-4000-8000-000000000001/quota/' || frame_order || '.webp',
  'image/webp',
  1
from generate_series(0, 9) as frame_order;

select results_eq(
  $$select count(*) from public.project_frames
    where project_id = 'a0000000-0000-4000-8000-000000000005'$$,
  array[10::bigint],
  'the frame quota allows ten frames'
);
select throws_ok(
  $$insert into public.project_frames (
      id, project_id, frame_order, settings, image_path, image_content_type, image_byte_size
    ) values (
      'a2000000-0000-4000-8000-000000000011',
      'a0000000-0000-4000-8000-000000000005',
      10,
      '{"version":1}',
      '10000000-0000-4000-8000-000000000001/quota/10.webp',
      'image/webp',
      1
    )$$,
  '23514',
  null,
  'the frame quota rejects an eleventh order'
);

delete from public.projects
where id in (
  'a0000000-0000-4000-8000-000000000005',
  'a0000000-0000-4000-8000-000000000006'
);

select results_eq(
  $$select result_code
    from public.save_project_snapshot(
      'a0000000-0000-4000-8000-000000000010',
      null,
      'aa000000-0000-4000-8000-000000000010',
      'RPC project',
      1,
      '{"version":1}',
      now(),
      '[
        {
          "id":"a3000000-0000-4000-8000-000000000001",
          "frame_order":0,
          "settings":{"version":1},
          "image_path":"10000000-0000-4000-8000-000000000001/rpc/one.webp",
          "image_content_type":"image/webp",
          "image_byte_size":1
        },
        {
          "id":"a3000000-0000-4000-8000-000000000002",
          "frame_order":1,
          "settings":{"version":1},
          "image_path":"10000000-0000-4000-8000-000000000001/rpc/two.webp",
          "image_content_type":"image/webp",
          "image_byte_size":1
        }
      ]'
    )$$,
  $$values ('applied'::text)$$,
  'save_project_snapshot creates an owner project'
);
select results_eq(
  $$select result_code
    from public.save_project_snapshot(
      'a0000000-0000-4000-8000-000000000010',
      0,
      'aa000000-0000-4000-8000-000000000011',
      'stale',
      2,
      '{"version":1}',
      now(),
      '[]'
    )$$,
  $$values ('revision_conflict'::text)$$,
  'save_project_snapshot reports stale revisions'
);
select results_eq(
  $$select result_code
    from public.save_project_snapshot(
      'a0000000-0000-4000-8000-000000000010',
      1,
      'aa000000-0000-4000-8000-000000000012',
      'RPC reordered',
      2,
      '{"version":1}',
      now(),
      '[
        {
          "id":"a3000000-0000-4000-8000-000000000001",
          "frame_order":1,
          "settings":{"version":1},
          "image_path":"10000000-0000-4000-8000-000000000001/rpc/one.webp",
          "image_content_type":"image/webp",
          "image_byte_size":1
        },
        {
          "id":"a3000000-0000-4000-8000-000000000002",
          "frame_order":0,
          "settings":{"version":1},
          "image_path":"10000000-0000-4000-8000-000000000001/rpc/two.webp",
          "image_content_type":"image/webp",
          "image_byte_size":1
        }
      ]'
    )$$,
  $$values ('applied'::text)$$,
  'save_project_snapshot applies an atomic reorder'
);
select results_eq(
  $$select id, frame_order from public.project_frames
    where project_id = 'a0000000-0000-4000-8000-000000000010'
    order by frame_order$$,
  $$values
    ('a3000000-0000-4000-8000-000000000002'::uuid, 0),
    ('a3000000-0000-4000-8000-000000000001'::uuid, 1)$$,
  'the reordered frame positions are persisted'
);
select throws_ok(
  $$select public.save_project_snapshot(
      'a0000000-0000-4000-8000-000000000011',
      null,
      'aa000000-0000-4000-8000-000000000013',
      'spoofed path',
      1,
      '{"version":1}',
      now(),
      '[
        {
          "id":"a3000000-0000-4000-8000-000000000003",
          "frame_order":0,
          "settings":{"version":1},
          "image_path":"20000000-0000-4000-8000-000000000002/rpc/spoof.webp",
          "image_content_type":"image/webp",
          "image_byte_size":1
        }
      ]'
    )$$,
  '23514',
  null,
  'save_project_snapshot rejects an owner-path spoof'
);

set local "request.jwt.claims" =
  '{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}';

select results_eq(
  $$select count(*) from public.projects
    where id = 'a0000000-0000-4000-8000-000000000010'$$,
  array[0::bigint],
  'claim switching removes access to the first owner project'
);
select results_eq(
  $$select result_code
    from public.save_project_snapshot(
      'a0000000-0000-4000-8000-000000000010',
      2,
      'bb000000-0000-4000-8000-000000000001',
      'cross-user update',
      3,
      '{"version":1}',
      now(),
      '[]'
    )$$,
  $$values ('revision_conflict'::text)$$,
  'save_project_snapshot denies a cross-user update'
);
select results_eq(
  $$select count(*) from public.projects
    where id = 'a0000000-0000-4000-8000-000000000010'$$,
  array[0::bigint],
  'cross-user denial does not create a shadow project'
);
reset role;
set local session_replication_role = replica;
set local role authenticated;
select is_empty(
  $$delete from storage.objects
    where name = '10000000-0000-4000-8000-000000000001/a/frame.webp'
    returning name$$,
  'switched claims cannot delete the first owner object'
);

reset role;
set local session_replication_role = origin;
reset "request.jwt.claims";

select results_eq(
  $$select name from public.projects
    where user_id = '10000000-0000-4000-8000-000000000001'
      and id = 'a0000000-0000-4000-8000-000000000010'$$,
  $$values ('RPC reordered'::text)$$,
  'the denied cross-user save did not alter owner data'
);
select results_eq(
  $$select count(*) from storage.objects
    where name = '10000000-0000-4000-8000-000000000001/a/frame.webp'$$,
  array[1::bigint],
  'the denied cross-user delete did not alter owner storage'
);

set local role anon;
set local "request.jwt.claims" = '{"role":"anon"}';
select throws_ok(
  $$select public.save_project_snapshot(
      'a0000000-0000-4000-8000-000000000020',
      null,
      'aa000000-0000-4000-8000-000000000020',
      'anonymous',
      1,
      '{"version":1}',
      now(),
      '[]'
    )$$,
  '42501',
  null,
  'anonymous callers cannot execute save_project_snapshot'
);

reset role;
reset "request.jwt.claims";

select * from finish();
rollback;
