import { SIGNATURE_CATALOG } from "../signature";
import type { CssRecipe, SignatureSettings } from "../types";
import { compactCss, fence, lines, recipeLines, unit, type SkillContext } from "./context";

/**
 * The glow shadows repeat three times in the animation. Each distinct value is written once as a
 * variable and then referenced, which keeps the CSS short and easy to adjust.
 */
function glowVariables(css: string): string {
  const values = [...new Set([...css.matchAll(/box-shadow: ([^;]+);/g)].map((m) => m[1]))];
  const names = values.map((_, i) => `--glow-${["rest", "peak", "still"][i] ?? i + 1}`);
  let out = css;
  values.forEach((value, i) => (out = out.split(`box-shadow: ${value};`).join(`box-shadow: var(${names[i]});`)));
  return [":root {", ...values.map((v, i) => `  ${names[i]}: ${v};`), "}", out].join("\n");
}

/** Two CSS properties clash if setting one would replace the other. */
const canon = (key: string) => (/^border/.test(key) ? "border" : key === "backgroundColor" ? "background" : key);

/**
 * Hover effects must never replace the featured highlight. Properties the featured style also sets
 * (its glow, its border) apply on hover only to cards that are not featured. Everything else, such
 * as the lift, applies to every card. So a hovered featured card lifts and keeps its glow.
 */
function splitHover(hover: CssRecipe, featured: CssRecipe): { all: CssRecipe; notFeatured: CssRecipe } {
  const taken = new Set(Object.keys(featured).map(canon));
  const all: CssRecipe = {};
  const notFeatured: CssRecipe = {};
  for (const [key, value] of Object.entries(hover)) (taken.has(canon(key)) ? notFeatured : all)[key] = value;
  return { all, notFeatured };
}

/** CSS for the seven chosen signature details, written exactly as it should be used. */
export function signatureSection(ctx: SkillContext): string[] {
  const { signature: sig, spacing } = ctx.t;
  const cta = sig.primaryCta;
  const hoverCss = { ...sig.hover.css };
  const transition = hoverCss.transition;
  delete hoverCss.transition;
  const { all, notFeatured } = splitHover(hoverCss, sig.featuredHighlight.css);
  const chosen = (Object.keys(SIGNATURE_CATALOG) as (keyof SignatureSettings)[]).map((key) => `${SIGNATURE_CATALOG[key].label.toLowerCase()} ${sig[key].label.toLowerCase()}`);

  const css = lines(
    `/* Card: ${sig.cardStyle.label} */`,
    ".card {",
    recipeLines(ctx, sig.cardStyle.css),
    `  padding: ${ctx.tailwind ? `calc(var(--spacing) * ${unit(spacing.semantic.cardPadding)})` : `var(--space-${String(spacing.semantic.cardPadding / spacing.base).replace(".", "_")})`};`,
    "}",
    "",
    `/* Hover: ${sig.hover.label}. Every pricing card and every clickable card. Never replaces the featured highlight */`,
    ".card-hover {",
    transition ? `  transition: ${transition};` : null,
    "}",
    Object.keys(all).length ? [".card-hover:hover {", ...recipeLines(ctx, all), "}"] : null,
    Object.keys(notFeatured).length ? [".card-hover:not(.card-featured):hover {", ...recipeLines(ctx, notFeatured), "}"] : null,
    "",
    `/* Featured highlight: ${sig.featuredHighlight.label}. One per group. Combines with card-hover */`,
    ".card-featured {",
    recipeLines(ctx, sig.featuredHighlight.css),
    "}",
    "",
    `/* Primary call to action: ${cta.label}. One per screen, on the primary button */`,
    cta.stylesheet ? glowVariables(ctx.varize(cta.stylesheet).replace(/\.ds-cta-glow/g, ".cta")) : [".cta {", ...recipeLines(ctx, cta.css), "}"].join("\n"),
    "",
    `/* Icon container: ${sig.iconContainer.label} */`,
    ".icon-tile {",
    "  display: inline-flex; align-items: center; justify-content: center;",
    recipeLines(ctx, sig.iconContainer.css),
    "}",
    "",
    `/* Focus ring: ${sig.focusRing.label}. Every focusable element */`,
    ".focus-ring:focus-visible {",
    recipeLines(ctx, sig.focusRing.css),
    "}",
    "",
    `/* Divider: ${sig.divider.label} */`,
    ".divider {",
    recipeLines(ctx, sig.divider.css),
    "}",
    "",
    "/* Reduced motion: movement stops, everything stays visible */",
    "@media (prefers-reduced-motion: reduce) {",
    "  .card-hover, .card-hover:hover { transition: none; transform: none; }",
    "}",
  );

  return lines(
    "## Signature details",
    "",
    `Chosen: ${chosen.join("; ")}. Apply them everywhere and never swap one. Add this CSS to ${ctx.shadcn ? "globals.css" : ctx.tailwind ? "src/index.css" : "styles.css"}, after the tokens. It is the exact definition, with token references.`,
    "",
    fence("css", compactCss(css.join("\n")).split("\n")),
    "",
    `Every container is a \`card\`, every icon with a title an \`icon-tile\`, every focusable element ${ctx.tailwind ? "`focus-ring`" : "ringed (automatic on controls and links, `focus-ring` on anything custom)"}, and sections are separated by \`divider\`, never a bare border or \`<hr>\`. The primary button ${ctx.tailwind ? "" : "(\`btn--primary\`) "}adds \`cta\` on at most one action per screen.`,
    sig.featuredHighlight.notes ? `Featured: ${sig.featuredHighlight.notes}` : null,
    cta.notes ? `CTA: ${cta.notes}` : null,
    "",
  );
}
