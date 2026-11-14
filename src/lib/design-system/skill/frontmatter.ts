import { STACK_LABELS, lines, type SkillContext } from "./context";

/** YAML double-quoted string: backslashes and quotes are escaped, so any text is safe. */
const yamlString = (value: string) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

/**
 * The description tells an AI when to use this file. The use case comes first, because Claude Code
 * truncates the listing text at 1,536 characters. The product description is added only if there is one.
 */
export function descriptionFor(ctx: SkillContext): string {
  const named = ctx.product !== "this product";
  const system = named ? `the ${ctx.product} design system` : "the design system";
  const about = ctx.description ? ` About the product: ${ctx.description.replace(/[.\s]+$/, "")}.` : "";
  return (
    `Use for ANY UI work in ${ctx.product}: building or changing pages, components, forms, tables, dashboards, charts, pricing, empty states, emails and interface copy. ` +
    `Applies ${system} (tokens, component recipes, signature details, tone of voice). ` +
    `Read it before writing UI code or microcopy, and never invent colors, sizes or fonts.${about}`
  );
}

export function frontmatter(ctx: SkillContext): string[] {
  return ["---", `name: ${ctx.slug}`, `description: ${yamlString(descriptionFor(ctx))}`, "---", ""];
}

export function header(ctx: SkillContext): string[] {
  const { t, s } = ctx;
  const tw = ctx.tailwind;
  const minText = t.typography.sizes[0].px;
  const bp = t.layout.breakpoints;
  // The only raw values a component may contain, stated once so rule 1 and the checklist agree.
  const exceptions = `Exceptions: the Signature details code as written, 1px and 2px border and outline widths, and the breakpoint constants ${bp.sm}, ${bp.md}, ${bp.lg}, ${bp.xl}px.`;
  const title = ctx.product === "this product" ? "Design system" : `${ctx.product} design system`;
  return lines(
    `# ${title}`,
    "",
    `Design system for ${ctx.product}. Stack: ${STACK_LABELS[ctx.stack]}. Read it all before UI work, copy the recipes exactly, run the Final checklist before calling a screen done. If this file conflicts with the project's own instructions about file layout or tooling, follow the project for structure and this file for every visual value.`,
    "",
    "## Hard rules",
    "",
    tw
      ? `1. Use only the tokens in this file. Never hardcode hex, rgb() or pixel values, and never use arbitrary values such as \`bg-[${t.colors.brand[600]}]\` or \`p-[${t.spacing.semantic.cardPadding + 1}px]\`. Tailwind's default palette is disabled, so \`bg-blue-500\` does not exist. ${exceptions}`
      : `1. Use only the tokens in this file. Never write a raw color or size in a component. Reference \`var(--token)\` only. ${exceptions}`,
    "2. Never invent design values (colors, sizes, fonts, radii). If something is not covered, derive it from the tokens or ask.",
    "3. One primary button per view. Every other action is secondary or tertiary.",
    `4. One accent color per screen: the brand color. Other colors are only for status and chart series.${t.colors.secondary ? " The secondary color appears only through the `secondary` and `accent` roles." : ""}`,
    `5. Minimum text size is ${minText}px (\`${tw ? "text-xs" : "var(--text-xs)"}\`).`,
    "6. Use only the text and background pairs verified under Accessibility.",
    "7. Radius, spacing and shadows come only from their scales, one radius per component family.",
    "8. Headings use the heading font, other text the body font, code and IDs the mono font. Numbers in tables, dashboards and prices use tabular figures.",
    "9. Animation respects `prefers-reduced-motion` with a static fallback.",
    `10. Light mode only: no \`${tw ? "dark:" : "prefers-color-scheme: dark"}\` styles or \`.dark\` theme unless this file defines one.`,
    "11. All copy follows Tone of voice.",
    `12. Placeholder content: when real product facts (plan names, prices, features) are missing, ${ctx.stack === "html-css" ? "keep the sample content in the HTML, each block wrapped in a comment such as `<!-- SAMPLE CONTENT: plan names, prices -->` and marked `data-sample`. Pages work with JavaScript turned off: JavaScript is only for real behavior (a menu, a switch), never for content or icons" : "use sample content in one clearly marked data file"}. This covers all copy, page titles included; a meta description uses the product line the user entered, or is omitted. Report every placeholder, inert buttons and destinationless links included. Never claim terms (cancellation, trials, refunds, plan changes, security, uptime) unless the user provided them.`,
    '13. Sample names, emails, job titles and companies are invented and never match the user\'s name, job or employer, or anything from the machine, git config or browser. Use `example.com` and titles like "Operations lead" or "Support manager".',
    "14. Autofill must not change field colors: keep the token input background and text color.",
    `15. Primary button text is ${t.colors.brandReport.primaryText.isWhite ? "white" : "dark"} (\`${tw ? "text-primary-foreground" : "var(--primary-foreground)"}\`, ${t.colors.brandReport.primaryText.ratio}:1). Never change it.`,
    "",
  ).concat(s ? [] : []);
}
