import { shiftLightness } from "../color-math";
import { lines, table, unit, type SkillContext } from "./context";

/**
 * Common mistakes and the correct version. The wrong examples are near misses computed from the
 * tokens (a radius two pixels off, a brand color a little lighter), because near misses are the
 * mistakes an AI actually makes.
 */
export function dosAndDontsSection(ctx: SkillContext): string[] {
  const { radius, spacing, colors, typography } = ctx.t;
  const tw = ctx.tailwind;
  const code = (value: string) => `\`${value}\``;
  const nearBrand = shiftLightness(colors.brand[600], 0.06);
  const minText = typography.sizes[0].px;

  const rows: string[][] = [
    [`Mixed radius: ${code(tw ? `rounded-[${radius.md + 2}px]` : `border-radius: ${radius.md + 2}px`)} beside ${code(tw ? "rounded-md" : "var(--radius-md)")}`, `One radius per family: cards ${code(tw ? "rounded-lg" : "var(--radius-lg)")}, controls ${code(tw ? "rounded-md" : "var(--radius-md)")}, checkboxes ${code(tw ? "rounded-sm" : "var(--radius-sm)")}.`],
    [`Random blues: ${code(tw ? `bg-[${nearBrand}]` : `background: ${nearBrand}`)}, ${code(tw ? "bg-blue-500" : "color: blue")}`, `The brand color: ${code(tw ? "bg-primary, text-brand-600" : "var(--primary), var(--brand-600)")}.`],
    ["Two primary buttons in a view, or a primary button for Cancel.", `One ${code(tw ? 'variant="primary"' : "btn btn--primary")}. Cancel is tertiary, other actions secondary.`],
    ["A checkbox for a setting that applies instantly.", "A switch, with no save button. Checkboxes are for submitted forms."],
    [`Placeholder as the label, or ${code(tw ? "border-border" : "var(--border)")} on an input.`, `A visible label, and ${code(tw ? "border-input" : "var(--input)")} on the outline.`],
    [`Off-ladder spacing: ${code(tw ? `p-[${spacing.semantic.cardPadding + 1}px]` : `padding: ${spacing.semantic.cardPadding + 1}px`)}`, `The ladder: ${code(tw ? `p-${unit(spacing.semantic.cardPadding)} gap-${unit(spacing.semantic.stackGap)}` : "var(--space-6)")}.`],
    [`Text below the minimum: ${code(tw ? `text-[${minText - 2}px]` : `font-size: ${minText - 2}px`)}`, `${code(tw ? "text-xs" : "var(--text-xs)")} (${minText}px) is the smallest.`],
    ["A hover class on the featured pricing card that replaces its glow, or no hover on it.", `Every pricing card is ${code("card card-hover")}; the featured one adds ${code("card-featured")}.`],
  ];

  return lines("## Do and don't", "", ...table(["Don't", "Do"], rows), "");
}
