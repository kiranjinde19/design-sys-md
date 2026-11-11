# Progress

Plain-language log of what is built. Newest first.

## Latest
- **Small fixes before Dashboard and Charts (Step A5).** (1) Brand notice default: "Adjust" was a saved choice, not the default. The mode is part of the saved settings, so choosing Adjust for one color stayed on when a new color was typed. A new typed brand color now always starts in "Keep my exact color"; Reset to SaaS Clean and old files were already exact. (2) The adjust option is labeled by the size of the change ("Darken a little" or "Darken a lot", lightness change of 0.12 or more) and shows both hex values; the exact option says "(Recommended)" when dark text reaches 7:1 (yellow does, red does not). (3) A brand within about 20 degrees of the error red uses the foreground color for the focus ring and the focus border of controls (the signature ring now also uses the 3:1 focus step instead of a fixed brand-500, which fixes light brands); error text gets an alert icon; the rule is in the Accessibility section of the file (only when it applies) and in the editor notice. (4) The editor panel reserves a scrollbar gutter plus right padding. (5) Preview: every icon goes through one component that applies the icon style, stroke width and line ends (check marks, plan icon tiles, top bar, row actions, spinner, trash, alert); sample copy now comes from the tone of voice code the file uses (pricing CTA, Save label and helper, success and error toasts, empty state); shadows: cards level 1, hover lift level 2, menus 3, toasts 4, dialogs 5 (this swapped toasts and dialogs in the file, and the hover shadow was level 3 before, now 2 as the file's own table says); the Forms tab has a static menu, confirm dialog and two toasts. (6) Standing size rule added to CLAUDE.md. Found while checking: with a red brand (near the error hue) the plain HTML worst case file is 32.32 KiB, over the 32 KiB Codex cap; it was 32.16 KiB before this step, so it was already over (see sizes). Not cut; waiting for a decision.
- **Brand color engine and fixes (Step A4).** Brand mode (exact or adjusted) with a notice and two live sample buttons under the brand color field; the typed color and the mode are saved in autosave and in the data block (data format version 2, older files still import as exact); SaaS Clean is now version 4 and Blank slate version 2. The generated file has a new hard rule 15 (primary button text color, never change it). Brand colored text uses the first brand step that reads at 4.5:1; focus ring and control focus borders use a step that reads at 3:1; a brand within about 20 degrees of the error hue gets a tinted destructive variant (solid red only in confirmation dialogs) with a trash icon, notes in the button recipes and a do and don't row. Primary hover and pressed shades keep the primary text color (lighter shades with dark text). Preview fixes: no scrollbar unless the page is taller than the frame (thin when it shows), focus rings only for the keyboard, Forms fields max 480px, neutral muted More buttons in Tables, a white backdrop for the Signature tile sample. Stress tested with five brands (see the report). The checklist below replaces the old totals.
- **Stage 5, Step A3: polish and three more preview tabs.** Done from the written spec; `design/reference` still has no mockup files, so the comparison against them is still open. Polish: the logo mark is now three bars of different lengths (long, short, medium, 1.5px stroke); the Signature tile is one left aligned row (crisp border box, card, icon tile, "Get started" button with a static 2px inset ring, focus ring box) using the real chosen options; the Buttons tile field is 32px with 10px radius; the Colors editor shows the 10 step brand scale with step labels (600 marked) and the generated status colors. The "SaaS Clean, edited. Reset" bug: the check compared every setting including product name, description and stack (set on the Export screen), so a changed product fact looked like an edit and Reset could never clear it. It now compares design values only, ignoring key order and product facts: hidden on a fresh load, hidden with product facts set, shown after a real edit, hidden after Reset (tested). The editor panel was confirmed in the browser: #FFFFFF, 1px #E0E6ED, 16px radius, 24px padding. New preview tabs: Buttons and states (4 variants by 5 states, loading, inputs, checkbox, radio and switch with the usage rules), Forms (settings screen with a Profile card) and Tables (Team members). They are drawn with the plain HTML CSS that the skill file itself contains (scoped to the preview, with hover, pressed and focus copied as classes), so the preview shows what an AI would build from the file. The selected tab is remembered. Checked at 1440px in three setups (default, Editorial font with compact density and radius 4, teal with spacious density and radius 20) and a secondary outline, hard shadow, solid call to action setup.
- **Stage 5, Step A2: visual match to the mockup (polish pass).** Done from the written spec because `design/reference/Main.dc.html` and `Editor.dc.html` are still not in the repo or on the machine; the side-by-side comparison against them is still to do. Changes: every control is 10px (buttons, inputs, tabs, segmented controls, sample input), tiles and panels 16px; new top bar (32px rounded square logo with a three-line mark, tertiary Import file with an upload icon, 40px secondary theme toggle, primary Export file with a download icon, Reset removed from the bar); one segmented control style everywhere (preset switch, neutral tone, other short choices); board tiles with number chips, 14 medium titles, a plain green check for reviewed, top aligned content and captions with real token values; the Colors sample (32px brand swatches with step 600 outlined, neutral swatches, four labeled dots, an AA badge), the Typography sample ("Aa", "Inter + Inter", scale line, Title, Body, Caption), visible border colors, all five shadow levels; system list as tinted 44px tiles with number chips and a Back to board link; white 24px padded editor panel with a "1 of 9" chip and a Previous, Next with chevron footer; "SaaS Clean, edited. Reset" beside the progress indicator and at the bottom of the system list; preview tab strip without a scrollbar, a Recommended label, borderless muted token chips; and the preview is now scaled with a transform instead of zoom, which fixed the cards: title, description, price, features and buttons now line up exactly across the three cards. Checked in Chrome at 1440px, including a red brand (#E54848): the tool's own interface stayed indigo.
- **Stage 5, Step A: the tool's own screen at `/app`.** Top bar (56px: logo, preset switch with "Reset to SaaS Clean", Import file, light and dark switch, the one primary Export file button), a title row with "N of 9 reviewed" and a 9 segment progress bar, and the bento board of 9 live tiles (560px wide, 3 columns, 120px rows, 12px gaps). Clicking a tile opens the editor: system list (224px) plus editor panel (400px) with Back to board, Back and Next; reviewed tiles show a check. The preview tile on the right has six tabs; only Pricing is built (65% scale, sample content, crisp 2px featured border, one border beam button, equal height cards with aligned price, divider and features). The other five say "Coming next". The tool wears fixed SaaS Clean colors (light, plus a dark mode for the tool only) and never changes when the user edits; the preview gets the user's system through `--pv-*` CSS variables. Reviewed status is saved with the autosave (not in exported files). Controls are now shared (`src/components/controls/`) between `/debug` and `/app`, the signature options have pickers for the first time, selected buttons use a crisp 2px border instead of a primary fill so the screen keeps exactly one primary button, and the typography and voice editors use container queries so they fit the 400px panel. The two mockup files (`Main.dc.html`, `Editor.dc.html`) were not found in Downloads, so this step follows the written spec; `design/reference/` is ready for them (excluded from lint, type checks and the build). Export file and Import file link to `/debug` for now.
- **No halo effects anywhere.** Removed the pulsing halo button option, the blurred halo featured highlight and the halo-style names. Primary call to action options are now Solid, Border beam (default), Gradient fill, Underline sweep. Featured highlight options are now Crisp border (default: 2px solid brand-600, no shadow), Offset shadow (now a hard `drop-shadow` with no blur), Solid accent fill, Corner ribbon. The focus ring option "Glow ring" became "Soft ring" (a flat translucent ring, no blur). Hover: every card with `card-hover`, the featured one too, lifts 2px and gets the same shadow-md; the featured-card exclusion is gone (the featured values are only repeated for hover if a hover effect would overwrite them, which does not happen with the defaults). SaaS Clean is now version 3. Saved settings and imported files that still hold an old id silently become the new one, and the import summary says so ("Replaced the old glow with the border beam."). The unused CSS variables and keyframes for the old halo are gone from all three stacks. Tests: 53 of 53 pass (new: defaults, no halo text in any generated file for every option mix, old files from preset versions 1 and 2). Checked in headless Chrome: saved old settings load as the new options, "Reset to SaaS Clean" gives the beam and crisp border, the beam runs 3.6s linear and stops under reduced motion with a steady ring, pricing cards line up and every card lifts and gets the same shadow on hover.
- **Primary call to action is a border beam.** A thin static brand border plus one streak of light (bright head, fading tail, about a quarter of the ring) travelling around a 2px ring in 3.6s, linear, forever. CSS only: a registered `@property` angle on a `conic-gradient`, shown through a masked ring on `::before`, inside `@supports`. Reduced motion shows a steady brand-400 ring; browsers without support show the plain border.
- **32 KiB is the real cap; two new rules; size notes.** Codex's 32 KiB is now the cap for React and plain HTML, and nothing was cut (no palette steps, no examples). New rules in all three stacks: rule 13 (placeholder data never uses real personal details, use invented names and example.com addresses) and rule 14 plus a token based `:-webkit-autofill` CSS rule (autofill keeps the input background and text color). The Export step now shows a gentle note above 30 KiB ("close to the Codex limit") and keeps the strong warning above 32 KiB.
- **Catch-up list.** Skipped because already done: HTML checkbox tick and radio dot, React checkbox tick exception sentence, import feedback and the round trip test. Done now: pricing cards keep price, divider and features aligned (two lines reserved for the description, button pinned to the bottom); the placeholder rule covers all copy including page titles and meta descriptions (meta description uses the product line the user entered, or is omitted) and requires inert buttons and links to be reported; a new "Links" recipe in all three stacks (default, hover, active, visited, focus, and a bare logo or nav variant), with its contrast row in Accessibility and links added to the interactive states checklist item. Size work (not finished): shorter signature comments, selection rules, plain HTML focus ring as one rule.
- **Import feedback.** The "Import my previous file" step now shows a status box next to the button: the file name plus either a summary ("Restored SaaS Clean with 7 changes, product name Acme Billing, stack ...") or the exact reason it failed (no data block, invalid JSON, unsupported version, damaged block). The file name stays visible after the picker resets, the same file can be imported twice, and any .md, .markdown or .txt file is accepted. Checked: the data block already stores product name, description, stack, preset version and every setting that differs from the preset, so no format change was needed and older files still import.
- **Automated round trip test.** `npm run test:roundtrip` generates files from 13 different settings sets in all 3 stacks, imports both SKILL.md and AGENTS.md, generates again and checks the files are identical (44 tests, all pass). It also covers failure messages, same file twice, renamed copies and old files.
- **Checkbox and radio marks, icon exception, size pass.** Plain HTML checked checkboxes now show a tick and checked radios a dot (token-colored `::before` shapes, markup shown). React's checkbox tick (stroke 3, 12px) is named as the only exception to the Icons rule. CSS blocks in all stacks are now minified; repeated rules were merged (form control states, button disabled styles, badge and toast tones); prose that restated the code was cut. No rule was removed.
- **Public page top bar rule.** The public page layout now says the top bar action is secondary or tertiary when the page body has a primary button, primary only when the body has none, and never gets the `cta` effect (it is on at most one action per screen). Applies to all three stacks. Small wording trims elsewhere keep Next.js under 28 KiB.
- **Skill file content update.** Placeholder content rule, public and marketing page layout, pricing alignment (title and intro centered, card content left aligned), more verified contrast pairs, checklist rewording, install line about the starter home page.
- **React and plain HTML outputs fixed.** No Tailwind names in HTML prose, every class defined, variable-based CSS, automatic focus ring, overlays CSS, React switch/checkbox/radio/Button components, one CSS file name.

## File sizes (AGENTS.md, secondary color added)
Worst case = 60 character name, 200 character description, own fonts for heading and body.
| Stack | Normal | Worst case | Cap |
|---|---|---|---|
| Next.js | 27.99 KiB | 29.23 KiB | normal under 28.5 (met) |
| React | 29.28 KiB | 30.08 KiB | under 31.5 (met) |
| Plain HTML | 30.70 KiB | 31.49 KiB | under 31.5 (met, almost no room left) |
| Plain HTML, red brand #E54848 | 31.53 KiB | 32.32 KiB | **over 32 KiB** (was 32.16 before step A5) |

## Checklist counts
| Stage | Done | Total |
|---|---|---|
| Stage 1: Project setup | 5 | 5 |
| Stage 2: Token engine | 10 | 10 |
| Stage 3: Skill file generator | 5 | 7 |
| Stage 4: The tool's own screen (shell) | 6 | 7 |
| Stage 5: Live preview and editors | 5 | 11 |
| Stage 6: Landing page and final polish | 0 | 4 |
| **Overall** | **31** | **44** |

## Checklist by stage

### Stage 1: Project setup
- [x] Next.js app with TypeScript, Tailwind and shadcn/ui
- [x] GitHub repository and pushes to `main`
- [x] Vercel deploy from GitHub
- [x] Placeholder home page with the tagline and subheadline
- [x] `node_modules` and `.env` kept out of git

### Stage 2: Token engine
- [x] One design system object: settings (saved) and tokens (generated)
- [x] Color engine: 10 step brand scale, neutral and status scales, shadcn roles, contrast checks
- [x] Typography engine: curated fonts, pairings, even pixel type scale, per font tracking
- [x] Radius, spacing, borders, shadows and icons
- [x] Buttons and inputs with derived states, and signature details
- [x] Presets (SaaS Clean, Blank slate) with versions, frozen snapshots and a guard
- [x] Autosave in the browser
- [x] Brand color mode (exact or adjusted), brand text steps, focus steps and tinted destructive
- [x] Stress test with five brand colors (#E54848, #FACC15, #0F766E, #111827, #A5B4FC)
- [x] `/debug` pages for checking the engine

### Stage 3: Skill file generator
- [x] Skill file for three stacks (Next.js, React, plain HTML) with SKILL.md and AGENTS.md download
- [x] Import with feedback, plus the data block (format version 2, older files import)
- [x] Round trip test (73 tests)
- [x] Size under the Codex cap for every stack
- [x] Next.js and React files built in fresh projects
- [ ] Plain HTML worst case under 31.5 KiB for every brand color (red brand is 32.32 KiB)
- [ ] Plain HTML file tried in a real fresh page (only its CSS is syntax checked so far)

### Stage 4: The tool's own screen (shell)
- [x] `/app` route with the fixed SaaS Clean look (light and dark)
- [x] Top bar, title row with progress, board of 9 live tiles
- [x] Editor state with system list, panel, Back and Next
- [x] Reviewed status saved with the autosave
- [x] Shared controls used by `/debug` and `/app`
- [x] Visual polish passes from the written spec
- [ ] Compare against the two mockup files (they are not in `design/reference/` yet)

### Stage 5: Live preview and editors
- [x] Preview tab: Pricing
- [x] Preview tab: Buttons and states
- [x] Preview tab: Forms
- [x] Preview tab: Tables
- [x] Icon, tone of voice and shadow settings show in the preview
- [ ] Preview tab: Dashboard
- [ ] Preview tab: Charts
- [ ] Colors editor: roles drag and drop
- [ ] Real Export screen (links to `/debug` for now)
- [ ] Real Import screen (links to `/debug` for now)
- [ ] Remove `/debug` at the end of the stage

### Stage 6: Landing page and final polish
- [ ] Landing page at `/`
- [ ] Layout below 1280px (columns stack)
- [ ] Final deploy check on Vercel
- [ ] Final visual match against the mockups

## Open decisions
- None at the moment. The brand color engine decision was made (exact or adjusted, tinted destructive near red).

## Next
- Add the two mockup files to `design/reference/` and compare the screen against them (CLAUDE.md "Visual match rule").
- Build the Dashboard and Charts preview tabs.
- Colors editor: roles drag and drop.
