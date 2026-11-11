# Progress

Plain-language log of what is built. Newest first.

## Latest
- **32 KiB is the real cap; two new rules; size notes.** Codex's 32 KiB is now the cap for React and plain HTML, and nothing was cut (no palette steps, no examples). New rules in all three stacks: rule 13 (placeholder data never uses real personal details, use invented names and example.com addresses) and rule 14 plus a token based `:-webkit-autofill` CSS rule (autofill keeps the input background and text color). The Export step now shows a gentle note above 30 KiB ("close to the Codex limit") and keeps the strong warning above 32 KiB.
- **Catch-up list.** Skipped because already done: HTML checkbox tick and radio dot, React checkbox tick exception sentence, import feedback and the round trip test. Done now: pricing cards keep price, divider and features aligned (two lines reserved for the description, button pinned to the bottom); the placeholder rule covers all copy including page titles and meta descriptions (meta description uses the product line the user entered, or is omitted) and requires inert buttons and links to be reported; a new "Links" recipe in all three stacks (default, hover, active, visited, focus, and a bare logo or nav variant), with its contrast row in Accessibility and links added to the interactive states checklist item. Size work (not finished): shorter signature comments, selection rules, plain HTML focus ring as one rule.
- **Import feedback.** The "Import my previous file" step now shows a status box next to the button: the file name plus either a summary ("Restored SaaS Clean with 7 changes, product name Acme Billing, stack ...") or the exact reason it failed (no data block, invalid JSON, unsupported version, damaged block). The file name stays visible after the picker resets, the same file can be imported twice, and any .md, .markdown or .txt file is accepted. Checked: the data block already stores product name, description, stack, preset version and every setting that differs from the preset, so no format change was needed and older files still import.
- **Automated round trip test.** `npm run test:roundtrip` generates files from 13 different settings sets in all 3 stacks, imports both SKILL.md and AGENTS.md, generates again and checks the files are identical (44 tests, all pass). It also covers failure messages, same file twice, renamed copies and old files.
- **Checkbox and radio marks, icon exception, size pass.** Plain HTML checked checkboxes now show a tick and checked radios a dot (token-colored `::before` shapes, markup shown). React's checkbox tick (stroke 3, 12px) is named as the only exception to the Icons rule. CSS blocks in all stacks are now minified; repeated rules were merged (form control states, button disabled styles, badge and toast tones); prose that restated the code was cut. No rule was removed.
- **Public page top bar rule.** The public page layout now says the top bar action is secondary or tertiary when the page body has a primary button, primary only when the body has none, and never gets the `cta` glow (it is on at most one action per screen). Applies to all three stacks. Small wording trims elsewhere keep Next.js under 28 KiB.
- **Skill file content update.** Placeholder content rule, public and marketing page layout, pricing alignment (title and intro centered, card content left aligned), more verified contrast pairs, checklist rewording, install line about the starter home page.
- **React and plain HTML outputs fixed.** No Tailwind names in HTML prose, every class defined, variable-based CSS, automatic focus ring, overlays CSS, React switch/checkbox/radio/Button components, one CSS file name.

## File sizes (AGENTS.md, secondary color added)
Worst case = 60 character name, 200 character description, own fonts for heading and body.
| Stack | Normal | Worst case | Cap |
|---|---|---|---|
| Next.js | 28.06 KiB | 29.30 KiB | normal under 28.5 (met) |
| React | 29.36 KiB | 30.15 KiB | under 31.5 (met) |
| Plain HTML | 30.69 KiB | 31.48 KiB | under 31.5 (met, with almost no room left) |

Plain HTML is very close to its cap. New content in that stack will need matching savings.

## Built so far
1. Project setup, GitHub, Vercel deploy.
2. Token engine (colors, typography, radius, spacing, borders, shadows, controls, signature details) with presets SaaS Clean and Blank slate, versioned and guarded.
3. Skill file generator for three stacks, SKILL.md and AGENTS.md export, import with byte-identical round trip.
4. Bento board shell, wizard steps, live preview, tone of voice, export step with size meter and install help.
5. `/debug` pages (data and skill review) rebuilt on every deploy.

## Next
- Decide the React and HTML size question above.
- Autosave polish, final deploy checks.
