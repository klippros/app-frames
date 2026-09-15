# Supabase schema security checklist

Apply migrations with the Supabase CLI against a linked project or local stack,
then verify ownership isolation before enabling production auth.

## Apply

```bash
supabase start          # local
supabase db reset       # local, applies migrations
# or
supabase db push        # linked remote project
```

## Advisor checks

```bash
supabase db advisors
```

Fix any RLS / security advisor findings before shipping.

## Two-user isolation matrix

Create two authenticated users (A and B). Confirm:

1. A can insert/select/update/delete only A’s `projects` and `project_frames` rows.
2. B’s queries never return A’s rows (including by guessing UUIDs).
3. A can upload/download/delete objects only under `project-images/{A_user_id}/...`.
4. A cannot list or download B’s storage objects.
5. Uploading a non-WebP or >1.5 MiB object is rejected by the bucket limits.
6. Frame `image_path` values that do not start with the caller’s user id fail the check constraint.

Use the publishable/anon key with each user’s JWT. Never use the service-role key
from the browser.
