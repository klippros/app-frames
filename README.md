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
- Images are downscaled when wider than 1080px and re-encoded before upload.
- Signing out clears this browser’s cached project data for that account.

## Optional Supabase auth

Copy `.env.example` to `.env` and set:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Leave both blank to keep the app fully anonymous. Configure Google OAuth and
email magic-link providers in the Supabase dashboard, and allow the callback URL:

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
