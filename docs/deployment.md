# Deployment hardening

## Environment

- Ship only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (publishable) to the
  browser. Never embed the service-role key.
- Leave both empty to keep the tool fully anonymous and local.

## Auth providers

- Enable Google OAuth and email magic links in the Supabase dashboard.
- Set the Site URL to exactly `https://<host>/tools/app-frames/` and add only
  `https://<host>/tools/app-frames/auth/callback` to the production redirect
  allowlist. Replace `<host>` with the deployed hostname; do not use a wildcard.
- Review Auth rate limits for the expected traffic and enable hCaptcha or
  Cloudflare Turnstile before public launch, especially for email OTP.
- Google sign-in opens a separate window so the editor tab keeps in-memory sketches.

### Local Supabase + Mailpit

`supabase/config.toml` contains these exact local entries:

- `site_url`: `http://127.0.0.1:5173/tools/app-frames/`
- `http://127.0.0.1:5173/tools/app-frames/`
- `http://127.0.0.1:5173/tools/app-frames/auth/callback`
- `http://localhost:5173/tools/app-frames/`
- `http://localhost:5173/tools/app-frames/auth/callback`

After changing those values, restart local Supabase (`supabase stop && supabase start`)
and request a new magic link. The Mailpit link’s `redirect_to` must be the Vite
callback (not `:3000`), for example:

`...&redirect_to=http://127.0.0.1:5173/tools/app-frames/auth/callback`

Open the app at the same host you allowlisted (`127.0.0.1` vs `localhost`).

## Content Security Policy

Set a CSP at the hosting layer and replace `<project-ref>`:

```text
default-src 'self';
connect-src 'self' https://<project-ref>.supabase.co wss://<project-ref>.supabase.co;
img-src 'self' blob: data:;
script-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
object-src 'none';
base-uri 'self';
frame-ancestors 'none';
form-action 'self';
```

The inline-style allowance is required by the current Chakra/Emotion runtime;
avoid `'unsafe-eval'`. Private project images are fetched with the user JWT and
rendered through short-lived `blob:` URLs. The `project-images` bucket must
remain private.

## Quotas and uploads

- Database enforcement limits each account to 3 projects and each project to 10
  frames.
- The browser accepts static PNG, JPEG, GIF, and WebP only. It rejects SVG,
  MIME/container mismatches, malformed or animated containers, source files over
  40 MiB, and decoded images over 40 megapixels.
- Normalization never upscales, caps width at 1080px, targets 500 KiB WebP, and
  rejects output still larger than 1.5 MiB. The private bucket independently
  allows only `image/webp` objects up to 1.5 MiB.
- Named projects autosave; unnamed sketches never leave the device.

## Snapshot conflicts and local cleanup

Metadata is committed through one security-invoker RPC. It locks the project,
compares the expected revision, and atomically applies the project plus complete
frame set. A stale revision returns a conflict without a partial write. A
snapshot ID makes retry after a lost response idempotent. Upload compensation
and post-commit sweeps remove unreferenced image objects on a best-effort basis.

Explicit sign-out waits up to four seconds for a final queue flush, then stops
sync and clears that user’s IndexedDB queue and blobs even when offline or when
the flush fails. Token expiry and direct account replacement stop sync before
clearing the old account’s local data and never flush old writes into the new
session. The editor workspace and object URL cache are reset on either
transition.

## Retention and deletion

Project rows and referenced images remain until the user deletes the project or
the account is deleted. Project deletion cascades database rows and queues a
best-effort private-storage prefix cleanup. Replaced and failed-upload images are
swept when sync succeeds. Document any hosted backup/PITR retention separately:
deletion from the live database or bucket does not imply immediate removal from
provider backups.
