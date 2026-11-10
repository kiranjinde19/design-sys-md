import { STACK_LABELS, fence, lines, type SkillContext } from "./context";

/** YAML double-quoted string: backslashes and quotes are escaped, so any text is safe. */
const yamlString = (value: string) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

/**
 * The description is what tells an AI when to use this file. Claude Code truncates the listing
 * text at 1,536 characters, so the use case comes first and the whole thing stays short.
 */
export function descriptionFor(ctx: SkillContext): string {
  const where = ctx.product;
  const about = ctx.description ? ` About the product: ${ctx.description.replace(/[.\s]+$/, "")}.` : "";
  return (
    `Use for ANY UI work in ${where}: building or changing pages, components, forms, tables, dashboards, charts, pricing, empty states, emails and interface copy. ` +
    `Applies ${ctx.product === "this product" ? "the" : `the ${where}`} design system (tokens, component recipes, signature details, tone of voice). ` +
    `Read it before writing UI code or microcopy, and never invent colors, sizes or fonts.${about}`
  );
}

export function frontmatter(ctx: SkillContext): string[] {
  return ["---", `name: ${ctx.slug}`, `description: ${yamlString(descriptionFor(ctx))}`, "---", ""];
}

export function header(ctx: SkillContext): string[] {
  const { t, product } = ctx;
  const title = ctx.product === "this product" ? "Design system" : `${ctx.product} design system`;
  const minText = t.typography.sizes[0].px;
  const secondary = ctx.t.colors.secondary;
  return lines(
    `# ${title}`,
    "",
    `This file is the design system for ${product}. Stack: ${STACK_LABELS[ctx.stack]}. Read all of it before any UI work, find the pattern in Components, copy the classes exactly, and run the Final checklist before saying a screen is done.`,
    "",
    "## Hard rules",
    "",
    "1. Use only the tokens in this file. Never hardcode hex colors, rgb() values or pixel values.",
    ctx.tailwind
      ? `2. Never use arbitrary Tailwind values such as \`bg-[${ctx.t.colors.brand[600]}]\`, \`p-[${ctx.t.spacing.semantic.cardPadding + 1}px]\` or \`text-[${ctx.t.typography.baseSize + 1}px]\`. Tailwind's default palette is disabled on purpose, so \`bg-blue-500\` does not exist.`
      : "2. Never write a raw color or size in a component. Reference `var(--token)` only.",
    "3. Never invent colors, sizes, fonts or radii. If something is not covered, derive it from the tokens or ask.",
    "4. One primary button per view. Every other action is secondary or tertiary.",
    secondary
      ? "5. One accent color per screen: the brand color. The secondary color supports it in small areas such as tags and highlights. Never use both as fills in the same component."
      : "5. One accent color per screen: the brand color. Everything else is neutral.",
    `6. Minimum text size is ${minText}px (\`${ctx.tailwind ? "text-xs" : "var(--text-xs)"}\`). Nothing smaller.`,
    "7. Use only the text and background pairs verified under Accessibility.",
    "8. One radius per component family. Use the radius tokens only, never a mix.",
    "9. Spacing comes from the ladder and shadows from the levels. Nothing else.",
    "10. Headings use the heading font. All other text uses the body font. The mono font is for code, IDs and keys only.",
    "11. Numbers in tables, dashboards and prices use tabular numbers.",
    "12. Animation must respect `prefers-reduced-motion`. Every animated detail has a static fallback.",
    "13. All copy follows the Tone of voice section.",
    "",
  );
}

export const fenceCss = (body: string[]) => fence("css", body);
