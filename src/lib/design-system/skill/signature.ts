import type { CssRecipe } from "../types";
import { compactCss, fence, lines, recipeLines, tightCss, unit, type SkillContext } from "./context";

/** The head of the beam is brand 100. Name it as the brand step, not as the card border that happens to share the color. */
function brandNames(ctx: SkillContext, css: string): string {
  const brand100 = ctx.t.colors.brand[100];
  return css.split(ctx.cssVar(brand100, "fill")).join(ctx.cssVar(brand100, "fill", ["brand-100"]));
}

/** Two CSS properties clash if setting one would replace the other. */
const canon = (key: string) => (/^border/.test(key) ? "border" : key === "backgroundColor" ? "background" : key);

/**
 * Every card with card-hover gets every hover effect, the featured card included. Only when a hover
 * effect would overwrite a property the featured style sets (a hover border color on a featured border),
 * the featured value is written again for its hover state, so the featured look never changes.
 */
export function featuredHoverFix(hover: CssRecipe, featured: CssRecipe): CssRecipe {
  const taken = new Set(Object.keys(hover).map(canon));
  const fix: CssRecipe = {};
  for (const [key, value] of Object.entries(featured)) if (taken.has(canon(key))) fix[key] = value;
  return fix;
}

/** CSS for the seven chosen signature details, written exactly as it should be used. */
export function signatureSection(ctx: SkillContext): string[] {
  const { signature: sig, spacing } = ctx.t;
  const cta = sig.primaryCta;
  const hoverCss = { ...sig.hover.css };
  const transition = hoverCss.transition;
  delete hoverCss.transition;
  const featuredFix = featuredHoverFix(hoverCss, sig.featuredHighlight.css);

  const css = lines(
    `/* Card: ${sig.cardStyle.label} */`,
    ".card {",
    recipeLines(ctx, sig.cardStyle.css),
    `  padding: ${ctx.tailwind ? `calc(var(--spacing) * ${unit(spacing.semantic.cardPadding)})` : `var(--space-${String(spacing.semantic.cardPadding / spacing.base).replace(".", "_")})`};`,
    "}",
    "",
    `/* Hover: ${sig.hover.label}. Pricing and clickable cards, featured too */`,
    ".card-hover {",
    transition ? `  transition: ${transition};` : null,
    "}",
    Object.keys(hoverCss).length ? [".card-hover:hover {", ...recipeLines(ctx, hoverCss), "}"] : null,
    "",
    `/* Featured: ${sig.featuredHighlight.label}. One per group */`,
    ".card-featured {",
    recipeLines(ctx, sig.featuredHighlight.css),
    "}",
    Object.keys(featuredFix).length ? [".card-featured:hover {", ...recipeLines(ctx, featuredFix), "}"] : null,
    "",
    `/* Primary CTA: ${cta.label}. One per screen */`,
    cta.stylesheet ? brandNames(ctx, ctx.varize(cta.stylesheet)).replace(/\.ds-cta-beam/g, ".cta") : [".cta {", ...recipeLines(ctx, cta.css), "}"].join("\n"),
    "",
    `/* Icon container: ${sig.iconContainer.label} */`,
    ".icon-tile {",
    "  display: inline-flex; align-items: center; justify-content: center;",
    recipeLines(ctx, sig.iconContainer.css),
    "}",
    "",
    `/* Focus ring: ${sig.focusRing.label} */`,
    ".focus-ring:focus-visible {",
    recipeLines(ctx, sig.focusRing.css),
    "}",
    "",
    `/* Divider: ${sig.divider.label} */`,
    ".divider {",
    recipeLines(ctx, sig.divider.css),
    "}",
    "",
    "/* Reduced motion */",
    "@media (prefers-reduced-motion: reduce) {",
    "  .card-hover, .card-hover:hover { transition: none; transform: none; }",
    "}",
  );

  return lines(
    "## Signature details",
    "",
    `Apply these everywhere, never swap one. Add this CSS to ${ctx.shadcn ? "globals.css" : ctx.tailwind ? "src/index.css" : "styles.css"} after the tokens; it is the exact definition.`,
    "",
    fence("css", tightCss(compactCss(css.join("\n"), 520).split("\n"))),
    "",
    `Every container is a \`card\`, every icon with a title an \`icon-tile\`, focusable elements ${ctx.tailwind ? "`focus-ring`" : "ringed (automatic in this CSS)"}, and sections are separated by \`divider\`, never a bare border or \`<hr>\`. The primary button ${ctx.tailwind ? "" : "(\`btn--primary\`) "}adds \`cta\` on at most one action per screen${cta.animated ? " (it repaints every frame)" : ""}.`,
    sig.featuredHighlight.notes ? `Featured: ${sig.featuredHighlight.notes}` : null,
    cta.notes ? `CTA: ${cta.notes}` : null,
    "",
  );
}
