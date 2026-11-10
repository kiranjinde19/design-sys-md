import { fence, lines, unit, weightClass, type SkillContext } from "./context";
import { inputClassString, statusTextClass } from "./components";

const TILE = "text-muted-foreground";

function cardsSection(ctx: SkillContext): string[] {
  const { typography, spacing, icons } = ctx.t;
  const title = typography.sizes.find((s) => s.name === "lg")!;
  const tw = ctx.tailwind;
  return lines(
    "### Cards",
    "",
    `A card is \`card\` (see Signature details): padding ${spacing.semantic.cardPadding}px, ${spacing.semantic.stackGap}px between parts, title ${title.px}px in the heading font, muted body text, one primary action at the bottom.`,
    "",
    fence(tw ? "tsx" : "html", tw
      ? `<div className="card card-hover flex flex-col gap-${unit(spacing.semantic.stackGap)}"><span className="icon-tile"><Icon className="size-${unit(icons.sizes.md)}" /></span><h3 className="font-heading text-${title.name} ${weightClass(typography.headingWeight)} tracking-heading-xs">Title</h3><p className="text-sm ${TILE}">Text.</p></div>`
      : `<div class="card card-hover"><span class="icon-tile">…</span><h3>Title</h3><p>Text.</p></div>`),
    "",
  );
}

function formsSection(ctx: SkillContext): string[] {
  const { spacing } = ctx.t;
  const tw = ctx.tailwind;
  return lines(
    "### Forms",
    "",
    `One column, full width. Labels above fields (${spacing.semantic.inlineGap / 2}px), fields ${spacing.semantic.stackGap}px apart, primary button last. Helper text is small and muted. An error replaces it, uses \`${statusTextClass(ctx, "error")}\`, and says what to fix; the field also gets the destructive border and \`aria-invalid\`, so color is never the only signal.`,
    "",
    fence(tw ? "tsx" : "html", tw
      ? [`<form className="flex flex-col gap-${unit(spacing.semantic.stackGap)}"><div className="flex flex-col gap-${unit(spacing.semantic.inlineGap / 2)}">`, `  <label htmlFor="email" className="text-sm font-medium">Email</label>`, `  <input id="email" className="${inputClassString(ctx)}" aria-describedby="email-help" />`, `  <p id="email-help" className="text-sm ${TILE}">Helper text.</p>`, "</div></form>"]
      : `<div class="field"><label for="email">Email</label><input id="email" class="input" aria-describedby="email-help"><p id="email-help" class="field__help">Helper text.</p></div>`),
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
    `Section gaps ${spacing.semantic.sectionGap}px, card grid gaps ${spacing.semantic.stackGap}px. Metrics first, then charts, then the table. A metric card: small muted label, the number (${big.px}px, heading font, tabular figures), one optional change line in \`${statusTextClass(ctx, "success")}\` or \`${statusTextClass(ctx, "error")}\` with an arrow or sign. One primary action per dashboard.`,
    "",
    fence(tw ? "tsx" : "html", tw
      ? `<div className="grid gap-${unit(spacing.semantic.stackGap)} sm:grid-cols-2 lg:grid-cols-4"><div className="card"><p className="text-sm ${TILE}">Label</p><p className="font-heading text-${big.name} ${weightClass(typography.headingWeight)} tracking-heading ${typography.tabularNumbers.className}">11,111</p></div></div>`
      : `<div class="stats"><div class="card"><p class="stat__label">Label</p><p class="stat__value">11,111</p></div></div>`),
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
    `Series colors, in order: ${[1, 2, 3, 4, 5].map((n) => (tw ? `\`fill-chart-${n}\`` : `\`var(--chart-${n})\``)).join(", ")}${tw ? " (and `stroke-chart-N`)" : ""}. Chart 1 is the brand color and the other four are spaced around the hue wheel with varied lightness. Never reorder them or add a sixth: group extras as "Other" in ${tw ? "`fill-neutral-400`" : "`var(--neutral-400)`"}. ${claim}`,
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
    `Grid with ${spacing.semantic.stackGap}px gaps, centered headings, equal height. Every plan is \`card card-hover\`, so all lift on hover. The recommended plan adds \`card-featured\`: a hovered featured card lifts and keeps its glow. Only it has the primary button with \`cta\`; the others are secondary. Price ${big.px}px, heading font, tabular figures. Write the button and the line under it so they are true for the product, in the Tone of voice.`,
    "",
    fence(tw ? "tsx" : "html", tw
      ? [`<div className="grid gap-${unit(spacing.semantic.stackGap)} md:grid-cols-3">`, `  <div className="card card-hover">…</div>`, `  <div className="card card-hover card-featured">…<Button variant="primary" className="cta">…</Button></div>`, "</div>"]
      : [`<div class="plans"><div class="card card-hover">…</div><div class="card card-hover card-featured">…<button class="btn btn--primary cta">…</button></div></div>`]),
    "",
  );
}

export const surfaceSections = (ctx: SkillContext): string[][] => [cardsSection(ctx), formsSection(ctx), dashboardsSection(ctx), chartsSection(ctx), pricingSection(ctx)];
