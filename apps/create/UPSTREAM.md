# Upstream

Vendored from https://github.com/shadcn-ui/ui `apps/v4` at commit 30a58d4498f270af1c1e981a7d78a15cf5740841 (MIT, see LICENSE-shadcn).

Removed: docs, blocks, charts, colors, examples, llm, (styles), (root) routes; /api, /og, /r, rss, sitemap; fumadocs (`source.config.ts`, `lib/source.ts`, `content/`); site nav/footer/command menu; Noto Sans Arabic/Hebrew fonts and docs sidebar script.
Replaced: `next.config.mjs` (minimal), `components/site-header.tsx`, `app/(app)/layout.tsx`.

Generated, gitignored: `styles/*` (run `bun run registry:build` or `bun ./scripts/build-registry.mts --style all`), `.next`.

Dev: `bunx next dev --webpack --port 4000`. Turbopack cannot resolve `next/font/google` here ("Can't resolve @vercel/turbopack-next/internal/font/google/font").
Removed also: v0 integration (v0.ts, init/v0 route, v0-button, open-in-v0, block-viewer, chart-code-viewer).
