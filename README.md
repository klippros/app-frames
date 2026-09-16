# App Frames

A browser-based tool that turns in-app screenshots into App Store and Google Play
marketing assets. Works fully offline as an unnamed sketch; optional Supabase
sign-in unlocks private named projects.

**Try it live:** [klippros.com/tools/app-frames](https://klippros.com/tools/app-frames)

## How it works

1. Upload one or more screenshots (or open a saved project when signed in)
2. Preview framed assets (toggle iOS / Android preview)
3. Customize per frame (title, position, replace, reorder) and globally (gradient hue, device bezel)
4. Export a ZIP of store-sized JPEGs
5. Optionally save the sketch as a named project after export or from the header

## Privacy

- **Sketches** live only in the current browser tab. Reloading or closing the tab
  discards them. They are never written to `localStorage` or IndexedDB.
- **Named projects** (signed-in only) upload normalized WebP frames and settings
  to private Supabase Storage and Postgres tables protected by RLS.
- Each save is one transactional project snapshot. An expected server revision
  prevents a stale browser from overwriting a newer revision; conflicts remain
  queued locally and are reported instead of partially updating frames.
- Accounts are limited to 3 projects with 10 frames each. Input is limited to
  static PNG, JPEG, GIF, or WebP (no SVG or animated containers), 40 MiB and
  40 megapixels. Images are capped at 1080px wide, re-encoded as WebP, and must
  compress below 1.5 MiB.
- Signing out clears that account’s IndexedDB queue and blobs even if the final
  sync fails or times out. Token expiry and account replacement stop sync first,
  discard the prior account’s local data without flushing it, and reset the
  in-memory workspace.

## Optional Supabase auth

Copy `.env.example` to `.env` and set:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Leave either value blank to keep the app fully anonymous. Configure Google OAuth
and email magic-link providers in the Supabase dashboard, and allow the exact
production callback URL (do not use a wildcard):

`https://<host>/tools/app-frames/auth/callback`

See:

- [docs/supabase-security.md](docs/supabase-security.md) — migrations, RLS, isolation checks
- [docs/deployment.md](docs/deployment.md) — CSP, quotas, logout behavior

## Development

Prerequisites: Node.js, pnpm 10+.

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm build
pnpm preview
pnpm test
```

## Contributing

See [AGENTS.md](AGENTS.md) for project conventions.

---

© 2026 Klippros Studios AB · [GitHub](https://github.com/klippros/app-frames)
