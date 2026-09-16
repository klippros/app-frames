# Supabase security tests

The automated security suite uses two fixed local auth users, switches JWT
claims inside transaction-wrapped pgTAP tests, and never contacts a hosted
project.

## Local prerequisites and commands

Install Docker and Supabase CLI 2.116.0 or newer. Start the local stack before
running either command; a missing CLI, Docker daemon, or local stack is an
error, not a skipped test.

```bash
pnpm exec supabase start
pnpm exec supabase db reset
pnpm test:db
pnpm test:db:lint
pnpm exec supabase db advisors --local --type all --level warn --fail-on error
```

`pnpm test:db` runs `supabase test db --local`. It covers project and frame
CRUD isolation, private Storage policies and bucket restrictions, ownership
spoofing, quotas, and atomic snapshot authorization/conflicts/reordering.
These local tests use no service-role browser credentials or CI secrets.

## Access model

- `profiles`, `projects`, and `project_frames` have RLS enabled. Policies compare
  row ownership with `(select auth.uid())`.
- The exposed `save_project_snapshot` RPC is `security invoker`, checks
  `auth.uid()` explicitly, uses an empty search path, and requires an
  authenticated caller.
- Authenticated table grants are column-scoped to reads, project deletion, and
  fields used by the snapshot transaction. The obsolete broad project/frame
  upsert grants are revoked. RLS still applies inside the RPC.
- Browser code receives only the Supabase URL and publishable/anon key. Never
  expose a secret or service-role key.
- `project-images` is private. Storage policies limit list/read/insert/update/
  delete to the first path segment matching `auth.uid()`. Uploads are create-only
  in the browser; compensation and sweep helpers delete unreferenced objects.

## Snapshot and quota guarantees

The RPC serializes each user/project pair, compares the expected revision, and
commits the project row and full frame set in one transaction. Stale revisions
return `revision_conflict`; snapshot IDs make retries idempotent. The database
limits users to 3 projects, frame positions to 0–9, snapshot arrays to 10 frames,
frame metadata to WebP, and image metadata to at most 1.5 MiB.

## Automated security matrix

- React rendering tests pass malicious project names as text children.
- Image tests reject SVG/unsupported types, MIME-container spoofing, malformed
  and animated PNG/GIF/WebP, files over 40 MiB, decoded images over 40
  megapixels, and WebP output over 1.5 MiB.
- Sync/session tests stop stale work on account change, clear old data on token
  expiry, and clear IndexedDB after failed, timed-out, or offline sign-out flushes.
- Two-user pgTAP and Storage integration tests cover row/object reads, writes,
  deletes, owner-path spoofing, RPC conflicts, and cross-user snapshot attempts.
- Missing-config tests keep project loading and auth actions inactive.

## Hosted checks

```bash
pnpm exec supabase link --project-ref <project-ref>
pnpm exec supabase db advisors --linked --type all --level warn --fail-on error
```

Hosted/provider verification cannot be proven by local tests. Before production,
verify the exact Site URL and redirect allowlist, OAuth and email-link delivery,
CAPTCHA and rate-limit settings, the deployed CSP, the hosted bucket’s private
status and limits, hosted advisor output, account deletion, and backup/PITR
retention. Also exercise a genuinely expired/revoked hosted token; local tests
cover the application transition behavior but not provider-side revocation.

The exact URL and CSP values, upload restrictions, local cleanup behavior, and
retention expectations are documented in [deployment.md](deployment.md).

Local advisor warnings must be recorded rather than silently ignored. At the
Phase 7 local verification level (`warn`), the advisor returned no findings.
