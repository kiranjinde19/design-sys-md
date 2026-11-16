# Plinth

Plinth is a free web tool. You build your brand design system with sliders, pickers and drag and drop, then download one markdown file (`SKILL.md` for Claude Code, `AGENTS.md` for Codex and ChatGPT). Your AI coding tool reads it before it builds, so your product looks like yours from the first screen. Plinth builds your SKILL.md. (Earlier working name: Design Sys.md.)

- No login, no backend, no database. Everything runs in the browser, and your work is saved in the browser.
- `/` is the landing page. `/app` is the tool. `/app/export` is the Export and Import screen.
- Stack: Next.js (App Router), TypeScript, Tailwind CSS 4, shadcn/ui. Deployed on Vercel from GitHub.

## Run it on your Mac

```bash
npm install          # once
npm run dev          # then open http://localhost:3000 (landing page) and http://localhost:3000/app (the tool)
```

For the production version, which is what the tests use:

```bash
npm run build
npm run start        # http://localhost:3000
```

## Tests

```bash
npm run test:roundtrip   # the file generator: export, import, export again gives the same file
npm run test:fast        # about 1.5 minutes: everything except the slowest every width checks
npm run test:full        # everything (the same as npm run test:live)
```

The browser tests drive a real headless Chrome against a production build (run `npm run build` first). See `CLAUDE.md` for the project rules and `PROGRESS.md` for the checklist.

## Where things live

- `src/app/(site)`: the landing page. `src/app/(tool)`: the tool and the review pages under `/debug`.
- `src/lib/design-system`: the token engine and the SKILL.md generator (`skill/`). Every value comes from one design system object.
- `src/components/landing`: the landing page. Its demo uses the real engine, loaded in the browser after the page is up.
- `public/brand/plinth-wordmark.svg`: the wordmark. `src/app/icon.svg`: the favicon.
