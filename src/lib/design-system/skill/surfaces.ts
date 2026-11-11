import { compactCss, fence, lines, spaceVar, unit, weightClass, type SkillContext, tight } from "./context";
import { inputClassString, statusRef } from "./components";

const TILE = "text-muted-foreground";

function cardsSection(ctx: SkillContext): string[] {
  const { typography, spacing, icons } = ctx.t;
  const title = typography.sizes.find((s) => s.name === "lg")!;
  const tw = ctx.tailwind;
  return lines(
    "### Cards",
    "",
    `A card is \`card\` (see Signature details): title in the heading font, muted body text, one primary action at the bottom.`,
    "",
    tw ? fence("tsx", [`<div className="card card-hover flex flex-col gap-${unit(spacing.semantic.stackGap)}"><span className="icon-tile"><Icon className="size-${unit(icons.sizes.md)}" /></span><h3 className="font-heading text-${title.name} ${weightClass(typography.headingWeight)} tracking-heading-xs">Title</h3><p className="text-sm ${TILE}">Text.</p></div>`]) : null,
    "",
  );
}

function formsSection(ctx: SkillContext): string[] {
  const { spacing } = ctx.t;
  const tw = ctx.tailwind;
  return lines(
    "### Forms",
    "",
    `One column, full width. Labels above fields, primary button last. Helper text is small and muted. An error replaces it (${tw ? "" : "`field__help--error`, "}\`${statusRef(ctx, "error")}\`) and says what to fix; the field also gets the destructive border and \`aria-invalid\`, so color is never the only signal.`,
    "",
    fence(tw ? "tsx" : "html", tw
      ? [`<form className="flex flex-col gap-${unit(spacing.semantic.stackGap)}"><div className="flex flex-col gap-${unit(spacing.semantic.inlineGap / 2)}">`, `  <label htmlFor="email" className="text-sm font-medium">Email</label>`, `  <input id="email" className="${inputClassString(ctx)}" aria-describedby="email-help" />`, `  <p id="email-help" className="text-sm ${TILE}">Helper text.</p>`, "</div></form>"]
      : `<form class="form"><div class="field"><label for="email">Email</label><input id="email" class="input" aria-describedby="email-help"><p id="email-help" class="field__help">Helper text.</p></div></form>`),
    tw ? null : "",
    tw ? null : fence("css", tight(ctx, [`.form { display: grid; gap: var(--gap-stack); } .field { display: grid; gap: ${spaceVar(ctx, spacing.semantic.inlineGap / 2)}; } .field label { font-size: var(--text-sm); font-weight: ${ctx.t.controls.buttons.fontWeight}; }`, `.field__help { margin: 0; font-size: var(--text-sm); color: ${ctx.cssVar(ctx.t.colors.roles["muted-foreground"], "text")}; } .field__help--error { color: ${statusRef(ctx, "error")}; }`])),
    "",
  );
}

function dashboardsSection(ctx: SkillContext): string[] {
  const { spacing, typography } = ctx.t;
  const big = typography.sizes.find((s) => s.name === "3xl")!;
  const tw = ctx.tailwind;
  return lines(
    "### Dashboards",
    "",
    `Section gaps ${spacing.semantic.sectionGap}px, card grid gaps ${spacing.semantic.stackGap}px. Metrics first, then charts, then the table. A metric card: small muted label, the number (${big.px}px, heading font, tabular figures), one optional change line in \`${statusRef(ctx, "success")}\` or \`${statusRef(ctx, "error")}\` with an arrow or sign.`,
    "",
    fence(tw ? "tsx" : "html", tw
      ? `<div className="grid gap-${unit(spacing.semantic.stackGap)} sm:grid-cols-2 lg:grid-cols-4"><div className="card"><p className="text-sm ${TILE}">Label</p><p className="font-heading text-${big.name} ${weightClass(typography.headingWeight)} tracking-heading ${typography.tabularNumbers.className}">11,111</p></div></div>`
      : `<div class="stats"><div class="card"><p class="stat__label">Label</p><p class="stat__value">11,111</p><p class="stat__change stat__change--up">+12.4%</p></div></div>`),
    tw ? null : "",
    tw ? null : fence("css", tight(ctx, compactCss([`.stats { display: grid; gap: var(--gap-stack); }`, `@media (min-width: ${ctx.t.layout.breakpoints.sm}px) { .stats { grid-template-columns: repeat(2, 1fr); } } @media (min-width: ${ctx.t.layout.breakpoints.lg}px) { .stats { grid-template-columns: repeat(4, 1fr); } }`, `.stat__label { margin: 0; font-size: var(--text-sm); color: ${ctx.cssVar(ctx.t.colors.roles["muted-foreground"], "text")}; }`, `.stat__value { margin: 0; font: ${typography.headingWeight} var(--text-3xl)/var(--leading-3xl) var(--font-heading); letter-spacing: var(--tracking-heading); font-variant-numeric: ${typography.tabularNumbers.css.fontVariantNumeric}; }`, `.stat__change { margin: 0; font-size: var(--text-sm); font-variant-numeric: ${typography.tabularNumbers.css.fontVariantNumeric}; } .stat__change--up { color: ${statusRef(ctx, "success")}; } .stat__change--down { color: ${statusRef(ctx, "error")}; }`].join("\n")).split("\n"))),
    "",
  );
}

function chartsSection(ctx: SkillContext): string[] {
  const { colors } = ctx.t;
  const check = colors.chartCheck;
  const tw = ctx.tailwind;
  const claim = check.passes
    ? `Checked under normal vision, deuteranopia, protanopia and tritanopia simulation: the closest pair differs by ${check.minDistance} (OKLab; ${check.threshold} or more is clearly different) and each color reaches ${check.minContrast}:1 on the background. Still add markers or direct labels.`
    : `The color check found charts ${check.worstPair.join(" and ")} close under ${check.worstVision} (${check.minDistance}, below ${check.threshold}). Never rely on color alone: always add markers, patterns or direct labels.`;
  return lines(
    "### Charts",
    "",
    `Series colors, in order: ${[1, 2, 3, 4, 5].map((n) => (tw ? `\`fill-chart-${n}\`` : `\`var(--chart-${n})\``)).join(", ")}${tw ? " (and `stroke-chart-N`)" : ""}. Chart 1 is the brand color. Never reorder them or add a sixth: group extras as "Other" in ${tw ? "`fill-neutral-400`" : "`var(--neutral-400)`"}. ${claim}`,
    `Axis and legend text ${tw ? "`text-xs fill-muted-foreground`" : "`var(--text-xs)` in `var(--muted-foreground)`"}; grid lines ${tw ? "`stroke-border`" : "`var(--border)`"}, horizontal only; no borders, 3D or gradients. Tooltips are floating layers (${tw ? "`bg-popover text-popover-foreground border border-border rounded-md shadow-md`" : "popover colors, border, radius md, shadow 3"}) with tabular figures. Every chart has a title, a unit and a text summary for screen readers.`,
    "",
  );
}

function pricingSection(ctx: SkillContext): string[] {
  const { spacing, typography } = ctx.t;
  const big = typography.sizes.find((s) => s.name === "4xl")!;
  const tw = ctx.tailwind;
  return lines(
    "### Pricing cards",
    "",
    `${tw ? "Grid" : "A `.plans` grid"} with ${spacing.semantic.stackGap}px gaps, equal height. The section title and intro are centered; everything inside the cards (plan name, description, price, feature list) is left aligned. Every plan is \`card card-hover\`. The recommended plan adds \`card-featured\`: a hovered featured card lifts and keeps its glow. Only it has the primary button with \`cta\`; the others are secondary. Price ${big.px}px, heading font, tabular figures.`,
    "",
    tw ? fence("tsx", [`<div className="grid gap-${unit(spacing.semantic.stackGap)} md:grid-cols-3">`, `  <div className="card card-hover">…</div>`, `  <div className="card card-hover card-featured">…<Button variant="primary" className="cta">…</Button></div>`, "</div>"]) : null,
    tw ? null : "",
    tw ? null : fence("css", tight(ctx, [`.plans { display: grid; gap: var(--gap-stack); } @media (min-width: ${ctx.t.layout.breakpoints.md}px) { .plans { grid-template-columns: repeat(3, 1fr); } }`])),
    "",
  );
}

export const surfaceSections = (ctx: SkillContext): string[][] => [cardsSection(ctx), formsSection(ctx), dashboardsSection(ctx), chartsSection(ctx), pricingSection(ctx)];
