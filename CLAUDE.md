# Design Sys.md: Project Brief

Read this fully before writing any code. It is the source of truth for what we are building.

## Who I am working with

The owner is a brand and product designer with no coding background. Rules for working with them:

- Explain what you are doing in plain language before you do it.
- Work in small steps. After each step, tell me how to check it in the browser.
- Ask before installing any new package.
- Commit to git after every working step with a clear message.
- When something fails, explain the cause in one or two plain sentences, then fix it.
- Never make design decisions silently. If a visual choice is open, show 2 or 3 options.

## What we are building

**Design Sys.md** is a free web tool. A solo founder builds their brand design system from scratch using sliders, pickers and drag and drop, then downloads one markdown file. When they load that file into their AI coding tool (Claude Code, ChatGPT/Codex), the AI builds their product using that design system as the root base.

**Tagline:** Are you building a solid app? Here is your first stone for the foundation.
**Subheadline:** Stop shipping random blues and mismatched buttons. Teach your AI your brand first.

### Target user

A solo founder building a SaaS with Claude Code. They care about functionality, not about button radius, table type hierarchy, button states (primary, secondary, tertiary), or radio vs checkbox choices. Inconsistent screens make a young product look unfinished. That costs early customer trust and hours of rework, or a paid designer later.

### Product decisions (locked)

- Free forever. No login. One session. No backend, no database.
- Browser autosave (localStorage) so a refresh does not lose work.
- "Import my previous file" so a user can reload a downloaded skill file and keep editing.
- Starting presets: **SaaS Clean** and **Blank slate**.
- Output: one universal markdown file. Download as `SKILL.md` (with frontmatter) and as `AGENTS.md` (same content, different name, for ChatGPT/Codex).
- Stack selector for the generated file. Default: Next.js + Tailwind + shadcn/ui driven by CSS variable design tokens. Alternatives: React + Tailwind, plain HTML/CSS.

## Tech stack for this tool

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Deployed on Vercel from GitHub
- No server features needed. Everything runs in the browser.

## The tool's own look

- Minimal, bento grid structure, generous white space.
- Light and dark toggle (top right).
- Reference for feel: https://recent.design (image first, quiet chrome, content is the hero).
- The builder is one bento board. Each design system is a tile. A large tile holds the live preview. Clicking a tile opens its editor.

## Design systems and controls (launch)

| System | Control |
|---|---|
| Colors | Brand color picker, auto 10 step scale, an optional secondary color, shadcn-named roles (see "Color roles" below), live contrast checks at 4.5, 3 and 7 |
| Typography | A pairing gallery of 8 one-click pairings, plus a customize panel with independent heading, body and optional mono pickers (curated Google Fonts list, search, category chips, weights limited to what each font offers), a heading tracking slider (-0.04em to 0.02em), "Use my own font" (a licensed brand font plus a fallback), type scale slider (1.125 to 1.5), base size stepper, line height slider. Even pixel sizes (12px minimum) with 4px line heights. Each font has its own default heading tracking. A tabular-numbers token is included. See "Typography selection" below |
| Icons | Style (outline, solid, duotone), stroke width slider, round or sharp ends |
| Radius | One slider (0 to 24px) generating small, medium, large, full |
| Spacing | 4px or 8px base toggle, density slider (compact to spacious) |
| Borders | Width toggle (1 or 2px), color from neutral scale |
| Elevation and shadows | Levels slider, intensity slider, soft, hard or brand tinted style |
| Buttons and inputs | Secondary as fill or outline, height, focus ring style. States (hover, pressed, disabled, loading) auto derived. Radio vs checkbox vs switch usage rules generated |
| Signature details | Pick one per category (below) |
| Tone of voice | Three sliders (formal to casual, calm to enthusiastic, concise to explanatory, each 1 to 5) with a live preview of five sample lines (button label, empty state, error message, success message, pricing CTA). SaaS Clean defaults: casual, calm, concise. Moved from "Later" into launch scope because the skill file must contain tone of voice |

### Color roles

Roles use the exact shadcn/ui names: background, foreground, card, card-foreground, popover, popover-foreground, primary, primary-foreground, secondary, secondary-foreground, muted, muted-foreground, accent, accent-foreground, destructive, destructive-foreground, border, input, ring, chart-1 to chart-5, plus one extra, card-border.

- **card follows the card style.** For "tinted bento tile" it is the brand 50 tint with a brand 100 border (card-border), so bg-card gives the same result as the signature card. Popover keeps the plain card color.
- **input** is the lightest neutral that reaches 3:1 on every surface it can sit on (background, card, muted, accent, tinted tile). Placeholder text reaches 4.5:1. Decorative borders (border, card-border) have no contrast requirement.
- **chart-1 to chart-5** use distinct hues from the brand and status colors. Lightness is searched so the five stay apart under normal vision, deuteranopia, protanopia and tritanopia, and each reaches 3:1 on the background.
- **secondary and accent** come from the neutral scale unless a secondary color is added. Suggestions never land near the warning or error hues.

### Typography selection

- **Curated list (31 Google Fonts):** Inter, Geist, DM Sans, Plus Jakarta Sans, Manrope, Outfit, Figtree, Work Sans, IBM Plex Sans, Public Sans, Source Sans 3, Nunito Sans, Space Grotesk, Sora, Instrument Sans, Onest, Bricolage Grotesque (sans); Fraunces, Playfair Display, Lora, Source Serif 4, Newsreader, Instrument Serif, DM Serif Display, Merriweather (serif); Geist Mono, JetBrains Mono, IBM Plex Mono, Fira Code, Space Mono, DM Mono (mono). Each has a category, tags and the weights it really offers. The list lives in `src/lib/design-system/fonts.ts`, the only place font names are written besides the presets and pairings.
- **Pairings (heading + body):** Modern SaaS (Inter + Inter, default), Friendly product (Plus Jakarta Sans + Inter), Developer tools (Geist + Geist, with Geist Mono accent), Editorial (Fraunces + Inter), Sharp and technical (Space Grotesk + IBM Plex Sans), Bold startup (Bricolage Grotesque + DM Sans), Classic trust (Source Serif 4 + Source Sans 3), Refined (Instrument Serif + Instrument Sans). Each card shows the sample line "Stop shipping random blues and mismatched buttons.", a mood tag and a one-line reason.
- **Manual picks:** after a manual heading pick, suggest 3 body fonts by simple rules (serif heading gets a neutral sans, expressive sans heading gets a workhorse sans, same family as the safe option). Warn if the body font is a display style or lacks regular (400) or semibold (600).
- **Own font:** the user enters a font name and picks a fallback from the list. It is marked as a licensed brand font. Previews use the fallback. The skill file records the brand font plus the fallback.
- **Loading rules:** load only the fonts currently selected, in the weights they offer. The picker loads one tiny request with only the letters needed to spell the font names. The pairing cards load only the letters of the sample line. Never load the full list. Always `display=swap`. Only request weights a font offers, because Google rejects the whole request otherwise. Preview-only subsets are renamed so they never clash with a real font of the same name.
- **Type scale rules:** sizes are even whole pixels (12px minimum), and from 20px up they also sit on the 4px grid, so the default 1.2 ratio gives 12, 14, 16, 20, 24, 28, 32, 40, 48. rem is px divided by 16. Line heights are multiples of 4px, headings stay tighter than body text, and both the px value and the ratio are stored.
- **Heading weight:** choosing a heading font sets its weight to 600 if the font offers it, otherwise the closest weight it has. Pairings keep their own weights.
- **Tracking:** every font has its own default heading tracking (Inter -0.02em, Plus Jakarta Sans -0.005em, Geist -0.02em, Bricolage Grotesque -0.015em, Space Grotesk -0.01em, Fraunces -0.01em, Instrument Serif 0, other serifs 0 to -0.005em, mono 0). It is applied when a font or pairing is selected, and the slider can override it. Tracking applies fully at 2xl and larger, then fades to 0 (xl half, lg a quarter, base and smaller none).
- **Secondary color:** optional. With none added, secondary buttons use the neutral scale (fill 200, hover 300, pressed 400, text 900; outline uses the input border with a neutral 100 hover). Suggestions never land near the warning or error hues.
- **Tokens:** heading font, body font, optional mono font, weights, heading tracking, full CSS stacks with system fallbacks, and a tabular-numbers token (`font-variant-numeric: tabular-nums`) for tables and dashboards.

### Signature details options (SaaS Clean defaults in bold)

| Category | Options |
|---|---|
| Featured highlight | **Glow border**, offset shadow, solid accent fill, corner ribbon |
| Card style | Hairline border, soft shadow, **tinted bento tile**, glass blur |
| Hover | **Lift 2px**, border color shift, scale 1.02, background tint |
| Primary CTA | Solid, **animated glow border**, gradient fill, underline sweep |
| Icon container | Bare, tinted circle, **rounded square tile**, outlined badge |
| Focus ring | **Offset ring**, glow ring, thick outline |
| Divider | **Hairline**, dotted, spacing only, gradient fade |

### Later (not in the first build)

Motion (speed preset, easing picker), Theme modes for the generated system (light, dark, both with auto dark scale), Logo usage rules, Grid and breakpoints.

## Live preview tabs

Dashboard, Tables, Forms, Charts and graphs, Pricing, Buttons and States. Every control updates the preview in real time.

## What the generated skill file must contain

The generator lives in `src/lib/design-system/skill/`. Every value comes from the design system object, and nothing is hardcoded in the templates. Colors are written by token name (bg-primary, var(--ring)), never as hex outside the token definitions. The file is tight, with no filler, about 400 to 600 lines. Sections, in this order:

1. Frontmatter (`name`, `description`), then "Hard rules": use only these tokens, never hardcode hex colors or arbitrary pixel values, never invent colors, sizes or fonts, one primary button per view, one accent color per screen, minimum text size 12px, and if something is not covered, derive it from the tokens or ask.
2. Tokens as real code for the chosen stack: CSS variables with shadcn names, the Tailwind mapping (this project uses Tailwind 4, so CSS-first `@theme`, no tailwind.config), font loading, type scale with line heights, radius, spacing, borders, shadows, the tabular-nums rule.
3. Component recipes with real class examples and a states table: buttons (4 variants, 6 states), inputs, radio vs checkbox vs switch with use when and avoid when, selects, tables (type hierarchy, right aligned tabular numbers, row height by density), cards, forms, dashboards, charts, pricing cards.
4. Signature details as exact code, including the reduced motion fallback.
5. Tone of voice: principles, word choices, do and don't microcopy for buttons, errors, empty states and confirmations.
6. Accessibility: the verified contrast pairs, focus ring, reduced motion.
7. Do and don't pairs for common mistakes.
8. A final checklist the AI runs before finishing any screen.
9. One small fenced JSON data block at the end, so "Import my previous file" can restore everything.

The file must go beyond a list of values. It should carry rules for decisions, not only values.

### Export formats

- **SKILL.md** (Claude Code): YAML frontmatter on the first line with `name` (lowercase letters, numbers and hyphens, at most 64 characters, never `synced` or `anthropic-skills`) and `description`. The description says what the file does and when to use it, with the key use case first, because Claude Code truncates the combined listing text at 1,536 characters. Install at `.claude/skills/<name>/SKILL.md` (project) or `~/.claude/skills/<name>/SKILL.md` (all projects).
- **AGENTS.md** (Codex): the same content without frontmatter. Plain Markdown at the repository root, or `~/.codex/AGENTS.md` for all projects. Codex stops reading instruction files once they add up to 32 KiB by default (`project_doc_max_bytes`), so the file must stay under 32 KiB. The Export step shows a size meter.
- **Stacks:** Next.js + Tailwind + shadcn/ui (default), React + Tailwind, plain HTML/CSS. Each gets code that matches it.
- **Review page:** `/debug/skill` prints the full SaaS Clean SKILL.md as plain text, rebuilt on every deploy.

## Pricing page reference scenario (the success test)

Prompt "build me a pricing page" with the generated file loaded should produce:

- Voice: "You decide when to start. Cancel any time and it stops."
- Plan cards where the recommended plan has a static glowing border. All cards lift 2px on hover.
- Compact spacing, centered headings, one accent color per screen.
- Only one primary CTA per screen has a slow animated glow border. Respect reduced motion settings with a static border.

If the output looks like any generic SaaS template, the skill file is not strong enough.

## Build order

1. Project setup, GitHub repo, Vercel deploy of a blank page.
2. Token engine: turns slider and picker values into a design system object.
3. Skill file generator: turns that object into the markdown file, plus download.
4. Bento board shell and the system tiles with controls.
5. Live preview tabs. The editor is a ten step wizard: Colors, Typography, Radius, Spacing, Borders, Shadows, Buttons and inputs, Signature details, Tone of voice, Export.
6. Autosave, import, presets, polish, final deploy.

## Working rules for code

- TypeScript, small components, clear file names.
- All design values flow from one central design system object. No hardcoded colors or sizes inside preview components.
- Keep the code simple enough that a designer can follow the folder structure.
- Do not add login, database or analytics unless I ask.
