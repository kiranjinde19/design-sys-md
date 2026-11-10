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
  const primaryClass = tw ? 'variant="primary"' : "btn btn--primary";
  const secondaryClass = tw ? 'variant="secondary"' : "btn btn--secondary";

  const rows: string[][] = [
    [
      `Mixed radius: ${code(tw ? `rounded-[${radius.md + 2}px]` : `border-radius: ${radius.md + 2}px`)} next to ${code(tw ? "rounded-md" : "var(--radius-md)")}`,
      `One radius per family. Cards ${code(tw ? "rounded-lg" : "var(--radius-lg)")}, controls ${code(tw ? "rounded-md" : "var(--radius-md)")}, checkboxes ${code(tw ? "rounded-sm" : "var(--radius-sm)")}.`,
    ],
    [
      `Random blues: ${code(tw ? `bg-[${nearBrand}]` : `background: ${nearBrand}`)}, ${code(tw ? "bg-blue-500" : "color: blue")}`,
      `The brand color only: ${code(tw ? "bg-primary, text-brand-600" : "var(--primary), var(--brand-600)")}.`,
    ],
    [
      "Two primary buttons in one view, or a primary button for Cancel.",
      `One ${code(primaryClass)} for the main action. Cancel is tertiary. Other actions are ${code(secondaryClass)}.`,
    ],
    [
      "A checkbox for a setting that applies instantly (dark mode, notifications).",
      "A switch, with no save button. Checkboxes are for forms that get submitted.",
    ],
    [
      `Placeholder as the label, or ${code(tw ? "border-border" : "var(--border)")} on an input.`,
      `A visible label above the field and ${code(tw ? "border-input" : "var(--input)")} on the outline.`,
    ],
    [
      `Off-ladder spacing: ${code(tw ? `p-[${spacing.semantic.cardPadding + 1}px]` : `padding: ${spacing.semantic.cardPadding + 1}px`)}`,
      `The ladder only: ${code(tw ? `p-${unit(spacing.semantic.cardPadding)} gap-${unit(spacing.semantic.stackGap)}` : "var(--space-6)")}.`,
    ],
    [
      `Text below the minimum: ${code(tw ? `text-[${minText - 2}px]` : `font-size: ${minText - 2}px`)}`,
      `${code(tw ? "text-xs" : "var(--text-xs)")} (${minText}px) is the smallest size.`,
    ],
    [
      "Heading font on body text, or letter spacing on paragraphs.",
      "Heading font for headings only. Body text has no tracking.",
    ],
  ];

  return lines(
    "## 6. Do and don't",
    "",
    ...table(["Don't", "Do"], rows),
    "",
    "Copy do and don'ts are in Tone of voice.",
    "",
  );
}
