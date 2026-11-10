import { SIGNATURE_CATALOG } from "../signature";
import type { SignatureSettings } from "../types";
import { compactCss, fence, lines, recipeLines, table, unit, type SkillContext } from "./context";

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

/** CSS for the seven chosen signature details, written exactly as it should be used. */
export function signatureSection(ctx: SkillContext): string[] {
  const { signature: sig, spacing } = ctx.t;
  const cta = sig.primaryCta;
  const hoverCss = { ...sig.hover.css };
  const transition = hoverCss.transition;
  delete hoverCss.transition;

  const chosen = (Object.keys(SIGNATURE_CATALOG) as (keyof SignatureSettings)[]).map((key) => [SIGNATURE_CATALOG[key].label, sig[key].label]);

  const css = lines(
    `/* Card: ${sig.cardStyle.label} */`,
    ".card {",
    recipeLines(ctx, sig.cardStyle.css),
    `  padding: ${ctx.tailwind ? `calc(var(--spacing) * ${unit(spacing.semantic.cardPadding)})` : `var(--space-${String(spacing.semantic.cardPadding / spacing.base).replace(".", "_")})`};`,
    "}",
    "",
    `/* Hover: ${sig.hover.label}. Add to any card that is clickable */`,
    ".card-hover {",
    transition ? `  transition: ${transition};` : null,
    "}",
    ".card-hover:hover {",
    recipeLines(ctx, hoverCss),
    "}",
    "",
    `/* Featured highlight: ${sig.featuredHighlight.label}. One featured item per group */`,
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
    `/* Focus ring: ${sig.focusRing.label}. Every focusable element gets it */`,
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
    "## 3. Signature details",
    "",
    "These seven choices make the product recognisable. Apply them everywhere, and never swap one.",
    `Chosen: ${chosen.map(([detail, choice]) => `${detail.toLowerCase()} ${choice.toLowerCase()}`).join("; ")}.`,
    "",
    `Put this CSS in ${ctx.tailwind ? "globals.css, after the tokens" : "styles.css, after the tokens"}. It is the exact definition. Colors are token references.`,
    "",
    fence("css", compactCss(css.join("\n")).split("\n")),
    "",
    table(["Use", "Class", "Rule"], [
      ["Card, tile, panel", "`card`", "Every container that groups content."],
      ["Clickable card", "`card card-hover`", "Only cards that are links or buttons."],
      ["Recommended item", "`card card-featured`", "One per group, such as the recommended plan."],
      ["The main action", `${ctx.tailwind ? "primary button + " : ""}\`cta\``, "Only one per screen."],
      ["Icon beside a title or feature", "`icon-tile`", `Icon size ${ctx.t.icons.sizes.md}px, ${ctx.t.icons.style}, stroke ${ctx.t.icons.strokeWidth}px, ${ctx.t.icons.strokeLinecap} ends.`],
      ["Any focusable element", "`focus-ring`", "Buttons, links, inputs, checkboxes, radios, switches, selects, tabs."],
      ["Separating sections", "`divider`", "Never a plain `border-t` or `<hr>`."],
    ]),
    sig.featuredHighlight.notes ? "" : null,
    sig.featuredHighlight.notes ? `Featured highlight note: ${sig.featuredHighlight.notes}` : null,
    cta.notes ? `Primary CTA note: ${cta.notes}` : null,
    "",
  );
}
