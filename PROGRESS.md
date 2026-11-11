# Progress

Plain-language log of what is built. Newest first.

## Latest
- **Checkbox and radio marks, icon exception, size pass.** Plain HTML checked checkboxes now show a tick and checked radios a dot (token-colored `::before` shapes, markup shown). React's checkbox tick (stroke 3, 12px) is named as the only exception to the Icons rule. CSS blocks in all stacks are now minified; repeated rules were merged (form control states, button disabled styles, badge and toast tones); prose that restated the code was cut. No rule was removed.
- **Public page top bar rule.** The public page layout now says the top bar action is secondary or tertiary when the page body has a primary button, primary only when the body has none, and never gets the `cta` glow (it is on at most one action per screen). Applies to all three stacks. Small wording trims elsewhere keep Next.js under 28 KiB.
- **Skill file content update.** Placeholder content rule, public and marketing page layout, pricing alignment (title and intro centered, card content left aligned), more verified contrast pairs, checklist rewording, install line about the starter home page.
- **React and plain HTML outputs fixed.** No Tailwind names in HTML prose, every class defined, variable-based CSS, automatic focus ring, overlays CSS, React switch/checkbox/radio/Button components, one CSS file name.

## File sizes (AGENTS.md, with a secondary color)
| Stack | Normal | Worst case (60 char name, 200 char description) | Target 28.5 KiB |
|---|---|---|---|
| Next.js | 26.99 KiB | 27.29 KiB | met |
| React | 28.35 KiB | 28.65 KiB | met normally, 0.15 KiB over in the worst case |
| Plain HTML | 29.78 KiB | 30.08 KiB | over by about 1.3 KiB |

## Open decision
Plain HTML needs about 1.3 KiB more savings. What is left to cut is content, not wording: markup examples, the overlays CSS (dialog, toast, tabs, badge, avatar, skeleton) or the `--space-N` and palette steps nobody references. Or accept ~29.8 KiB, which is still under Codex's 32 KiB cap.

## Built so far
1. Project setup, GitHub, Vercel deploy.
2. Token engine (colors, typography, radius, spacing, borders, shadows, controls, signature details) with presets SaaS Clean and Blank slate, versioned and guarded.
3. Skill file generator for three stacks, SKILL.md and AGENTS.md export, import with byte-identical round trip.
4. Bento board shell, wizard steps, live preview, tone of voice, export step with size meter and install help.
5. `/debug` pages (data and skill review) rebuilt on every deploy.

## Next
- Decide the React and HTML size question above.
- Autosave polish, final deploy checks.
