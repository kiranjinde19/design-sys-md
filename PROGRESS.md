# Progress

Plain-language log of what is built. Newest first.

## Latest
- **Public page top bar rule.** The public page layout now says the top bar action is secondary or tertiary when the page body has a primary button, primary only when the body has none, and never gets the `cta` glow (it is on at most one action per screen). Applies to all three stacks. Small wording trims elsewhere keep Next.js under 28 KiB.
- **Skill file content update.** Placeholder content rule, public and marketing page layout, pricing alignment (title and intro centered, card content left aligned), more verified contrast pairs, checklist rewording, install line about the starter home page.
- **React and plain HTML outputs fixed.** No Tailwind names in HTML prose, every class defined, variable-based CSS, automatic focus ring, overlays CSS, React switch/checkbox/radio/Button components, one CSS file name.

## File sizes (AGENTS.md, full case)
| Stack | Size | Target |
|---|---|---|
| Next.js | 27.99 KiB | under 28 (met) |
| React | 29.24 KiB | over 28 |
| Plain HTML | 31.38 KiB | over 28, close to Codex's 32 KiB cap |

## Open decision
React and HTML cannot reach 28 KiB without cutting content (markup examples, badge/toast color variants, or overlays CSS). Options: keep 32 KiB as their real cap, or cut features from those two stacks.

## Built so far
1. Project setup, GitHub, Vercel deploy.
2. Token engine (colors, typography, radius, spacing, borders, shadows, controls, signature details) with presets SaaS Clean and Blank slate, versioned and guarded.
3. Skill file generator for three stacks, SKILL.md and AGENTS.md export, import with byte-identical round trip.
4. Bento board shell, wizard steps, live preview, tone of voice, export step with size meter and install help.
5. `/debug` pages (data and skill review) rebuilt on every deploy.

## Next
- Decide the React and HTML size question above.
- Autosave polish, final deploy checks.
