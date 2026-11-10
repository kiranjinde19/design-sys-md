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
| Colors | Brand color picker, auto 10 step scale, drag swatches onto roles (Primary, Surface, Background), live contrast badge |
| Typography | A pairing gallery of 8 one-click pairings, plus a customize panel with independent heading, body and optional mono pickers (curated Google Fonts list, search, category chips, weights limited to what each font offers), a heading tracking slider (-0.04em to 0.02em), "Use my own font" (a licensed brand font plus a fallback), type scale slider (1.125 to 1.5), base size stepper, line height slider. Whole pixel sizes, 12px minimum. A tabular-numbers token is included. See "Typography selection" below |
| Icons | Style (outline, solid, duotone), stroke width slider, round or sharp ends |
| Radius | One slider (0 to 24px) generating small, medium, large, full |
| Spacing | 4px or 8px base toggle, density slider (compact to spacious) |
| Borders | Width toggle (1 or 2px), color from neutral scale |
| Elevation and shadows | Levels slider, intensity slider, soft, hard or brand tinted style |
| Buttons and inputs | Secondary as fill or outline, height, focus ring style. States (hover, pressed, disabled, loading) auto derived. Radio vs checkbox vs switch usage rules generated |
| Signature details | Pick one per category (below) |

### Typography selection

- **Curated list (31 Google Fonts):** Inter, Geist, DM Sans, Plus Jakarta Sans, Manrope, Outfit, Figtree, Work Sans, IBM Plex Sans, Public Sans, Source Sans 3, Nunito Sans, Space Grotesk, Sora, Instrument Sans, Onest, Bricolage Grotesque (sans); Fraunces, Playfair Display, Lora, Source Serif 4, Newsreader, Instrument Serif, DM Serif Display, Merriweather (serif); Geist Mono, JetBrains Mono, IBM Plex Mono, Fira Code, Space Mono, DM Mono (mono). Each has a category, tags and the weights it really offers. The list lives in `src/lib/design-system/fonts.ts`, the only place font names are written besides the presets and pairings.
- **Pairings (heading + body):** Modern SaaS (Inter + Inter, default), Friendly product (Plus Jakarta Sans + Inter), Developer tools (Geist + Geist, with Geist Mono accent), Editorial (Fraunces + Inter), Sharp and technical (Space Grotesk + IBM Plex Sans), Bold startup (Bricolage Grotesque + DM Sans), Classic trust (Source Serif 4 + Source Sans 3), Refined (Instrument Serif + Instrument Sans). Each card shows the sample line "Stop shipping random blues and mismatched buttons.", a mood tag and a one-line reason.
- **Manual picks:** after a manual heading pick, suggest 3 body fonts by simple rules (serif heading gets a neutral sans, expressive sans heading gets a workhorse sans, same family as the safe option). Warn if the body font is a display style or lacks regular (400) or semibold (600).
- **Own font:** the user enters a font name and picks a fallback from the list. It is marked as a licensed brand font. Previews use the fallback. The skill file records the brand font plus the fallback.
- **Loading rules:** load only the fonts currently selected, in the weights they offer. The picker loads one tiny request with only the letters needed to spell the font names. The pairing cards load only the letters of the sample line. Never load the full list. Always `display=swap`. Only request weights a font offers, because Google rejects the whole request otherwise. Preview-only subsets are renamed so they never clash with a real font of the same name.
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

Motion (speed preset, easing picker), Theme modes for the generated system (light, dark, both with auto dark scale), Voice and tone sliders with sample microcopy, Logo usage rules, Grid and breakpoints.

## Live preview tabs

Dashboard, Tables, Forms, Charts and graphs, Pricing, Buttons and States. Every control updates the preview in real time.

## What the generated skill file must contain

1. Frontmatter (name, description) and a short "how to use this file" note.
2. Design tokens: colors (scales and roles), typography, radius, spacing, borders, elevation. Written as CSS variables plus Tailwind mapping.
3. Component recipes: buttons (all variants and states), inputs, radio vs checkbox vs switch, tables, cards, forms, charts.
4. Usage rules: when to use which variant, hierarchy, one accent color per screen.
5. Do and don't examples with short code or description pairs.
6. Tone of voice: how the product speaks, with sample microcopy.
7. Signature details: the chosen moves, applied consistently.
8. Stack specific implementation notes based on the stack selector.
9. A final checklist the AI must run before finishing any screen.

The file must go beyond a list of values. It should carry rules for decisions, not only values.

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
5. Live preview tabs.
6. Autosave, import, presets, polish, final deploy.

## Working rules for code

- TypeScript, small components, clear file names.
- All design values flow from one central design system object. No hardcoded colors or sizes inside preview components.
- Keep the code simple enough that a designer can follow the folder structure.
- Do not add login, database or analytics unless I ask.
