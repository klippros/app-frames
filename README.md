# App Frames

A simple browser-based tool that turns in-app screenshots into App Store and Google Play marketing assets. No account, no backend — upload, customize, export.

**Try it live:** [klippros.com/tools/app-frames](https://klippros.com/tools/app-frames)

## How it works

1. Upload one or more screenshots
2. Preview framed assets (toggle iOS / Android preview)
3. Customize per frame (title, position, replace, reorder) and globally (gradient hue, device bezel)
4. Export a ZIP of store-sized JPEGs

## Privacy

Sketches stay in the current browser tab until you close or reload it. When
optional Supabase sign-in is configured, saving a named project uploads
normalized frame images to your private account storage.

## Optional Supabase auth

Copy `.env.example` to `.env` and set:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Leave both blank to keep the app fully anonymous. Configure Google OAuth and
email magic-link providers in the Supabase dashboard, and allow the callback URL:

`https://<host>/tools/app-frames/auth/callback`

See [docs/supabase-security.md](docs/supabase-security.md) for migrations, RLS,
and the two-user isolation checklist.

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
