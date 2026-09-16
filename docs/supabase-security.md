# Supabase security tests

The automated security suite uses two fixed local auth users, switches JWT
claims inside transaction-wrapped pgTAP tests, and never contacts a hosted
project.

## Local prerequisites and commands

Install Docker and Supabase CLI 2.116.0 or newer. Start the local stack before
running either command; a missing CLI, Docker daemon, or local stack is an
error, not a skipped test.

```bash
supabase start
supabase db reset
pnpm test:db
pnpm test:db:lint
```

`pnpm test:db` runs `supabase test db --local`. It covers project and frame
CRUD isolation, private Storage policies and bucket restrictions, ownership
spoofing, quotas, and atomic snapshot authorization/conflicts/reordering.
These local tests use no service-role browser credentials or CI secrets.

## Hosted advisor checks

Advisor checks are environment-dependent and intentionally separate from local
CI. Link the intended project and authenticate the CLI, then run:

```bash
supabase link --project-ref <project-ref>
supabase db advisors --linked
```

## Manual security matrix

Before production:

1. Spoofed MIME / SVG upload is rejected client-side and by the bucket.
2. Oversized / decompression-bomb images fail normalization limits.
3. Expired sessions stop sync and cannot read private objects.
4. User A cannot list/read/mutate User B projects or storage objects.
5. Signing out offline still clears local project caches.
6. Missing Supabase env vars hide auth/project UI and keep sketch-only mode.
7. Malicious project names are stored as plain text and rendered safely.
