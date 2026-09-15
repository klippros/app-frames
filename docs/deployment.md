# Deployment hardening

## Environment

- Ship only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (publishable) to the
  browser. Never embed the service-role key.
- Leave both empty to keep the tool fully anonymous and local.

## Auth providers

- Enable Google OAuth and email magic links in the Supabase dashboard.
- Allow redirect URL: `https://<host>/tools/app-frames/auth/callback`
- Prefer CAPTCHA / bot protection and default auth rate limits for email OTP.
- Google sign-in opens a separate window so the editor tab keeps in-memory sketches.

### Local Supabase + Mailpit

`supabase/config.toml` points auth at the Vite app:

- `site_url`: `http://127.0.0.1:5173/tools/app-frames/`
- `additional_redirect_urls`: callback URLs for `127.0.0.1` and `localhost`

After changing those values, restart local Supabase (`supabase stop && supabase start`)
and request a new magic link. The Mailpit link’s `redirect_to` must be the Vite
callback (not `:3000`), for example:

`...&redirect_to=http://127.0.0.1:5173/tools/app-frames/auth/callback`

Open the app at the same host you allowlisted (`127.0.0.1` vs `localhost`).

## Content Security Policy (recommended)

Allow the app origin plus your Supabase project:

- `connect-src`: `'self' https://*.supabase.co wss://*.supabase.co`
- `img-src`: `'self' blob: data:`
- `script-src` / `style-src`: follow your host’s existing CSP for the Vite build

Private project images are downloaded with the user JWT and shown via short-lived
`blob:` URLs. Do not make the `project-images` bucket public.

## Quotas and uploads

- Browser normalization caps width at 1080px and re-encodes WebP.
- Bucket rejects non-WebP and objects larger than 1.5 MiB.
- Named projects autosave; unnamed sketches never leave the device.

## Logout

Sign-out attempts a short final sync flush, then clears IndexedDB project queues
and blobs for that user and resets the in-memory workspace so the next account
on the same browser starts clean.
