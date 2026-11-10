import { contrastRatio } from "../contrast";
import { lines, shadowClass, unit, weightClass, type SkillContext } from "./context";
import { maxWidthClass } from "./layout-nav";
import { statusTextClass } from "./components";
import type { ColorScale, SemanticName } from "../types";

/** The first text step of a scale that reads at 4.5:1 on its own 50 tint, for badges. */
function onTint(scale: ColorScale): number {
  return ([700, 800, 900] as const).find((step) => contrastRatio(scale[step], scale[50]) >= 4.5) ?? 900;
}

export function overlaysSection(ctx: SkillContext): string[] {
  const { colors, layout, elevation, spacing, controls, typography, signature } = ctx.t;
  const tw = ctx.tailwind;
  const level = (n: number) => shadowClass(Math.min(n, elevation.levels));
  const pct = Math.round(layout.overlayOpacity * 100);
  const title = `font-heading text-lg ${weightClass(typography.headingWeight)} tracking-heading-xs`;
  const semantic = (Object.keys(colors.semantic) as SemanticName[]).map((name) => `${name} ${onTint(colors.semantic[name])}`);
  const brandStep = onTint(colors.brand);
  const heights = controls.buttons.height;

  return lines(
    "## Overlays and feedback",
    "",
    `Floating layers use the \`popover\` role (never the tinted \`card\`), radius lg, the focus ring, \`icon-tile\` for icons, and a shadow for their height: popovers ${level(3)}, dialogs ${level(4)}, toasts ${level(5)}. Fades stop under reduced motion (${tw ? "`motion-reduce:transition-none`" : "`prefers-reduced-motion`"}).`,
    "",
    `- **Dialog:** ${tw ? `\`${maxWidthClass(layout.dialogWidth)} rounded-lg border border-border bg-popover text-popover-foreground ${level(4)} p-${unit(spacing.semantic.cardPadding)}\`` : `${layout.dialogWidth}px wide, popover colors, radius lg, shadow 4, padding ${spacing.semantic.cardPadding}px`} over \`${tw ? `bg-foreground/${pct}` : `foreground at ${pct}%`}\`. Title \`${title}\`, description \`text-sm text-muted-foreground\`. Footer right aligned, ${spacing.semantic.inlineGap}px gaps: tertiary Cancel, one primary action (destructive for deletes). Focus is trapped; Escape closes.`,
    `- **Toast:** the dialog surface with ${tw ? `\`${level(5)} p-${unit(spacing.semantic.stackGap)}\`` : "shadow 5"}. Title \`text-sm font-medium\`, description muted. Status icon in ${["success", "error", "warning", "info"].map((n) => `\`${statusTextClass(ctx, n as SemanticName)}\``).join(", ")}. \`role="status"\`, or \`role="alert"\` for errors. Only non-critical toasts auto-dismiss.`,
    `- **Tabs:** a row with ${tw ? "`border-b border-border`" : "a bottom border"}; each tab ${tw ? `\`h-${unit(heights.md)} px-${unit(spacing.semantic.inputPaddingX)} text-sm font-medium text-muted-foreground hover:text-foreground focus-ring\`` : `${heights.md}px tall, muted text`}; the active tab is ${tw ? "`text-foreground` with `border-b-2 border-primary`" : "foreground text with a 2px primary underline"}.`,
    `- **Badge:** ${tw ? "`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium`" : "pill, `--text-xs`, medium weight"}. Neutral ${tw ? "`bg-muted text-muted-foreground`" : "muted"}, brand ${tw ? `\`bg-brand-50 text-brand-${brandStep}\`` : `brand 50 with brand ${brandStep} text`}, status ${tw ? "`bg-{status}-50 text-{status}-N`" : "status 50 tint with dark text"} (${semantic.join(", ")}). A badge is a label, never a button.`,
    `- **Avatar:** ${tw ? `\`rounded-full bg-muted text-sm font-medium text-muted-foreground\`` : "round, muted fill"}, sizes ${tw ? `\`size-${unit(heights.sm)}\`, \`size-${unit(heights.md)}\`, \`size-${unit(heights.lg)}\`` : `${heights.sm}, ${heights.md}, ${heights.lg}px`}, initials when there is no image.`,
    `- **Skeleton:** ${tw ? "`animate-pulse rounded-md bg-muted motion-reduce:animate-none`" : "muted blocks with a slow pulse that stops under reduced motion"}, shaped like the content it replaces, same sizes and gaps. Never a spinner for a whole page.`,
    "",
    signature.focusRing.id ? "" : "",
  ).filter((line, i, all) => !(line === "" && all[i - 1] === ""));
}

export function iconsSection(ctx: SkillContext): string[] {
  const { icons } = ctx.t;
  const tw = ctx.tailwind;
  const sizes = [icons.sizes.sm, icons.sizes.md, icons.sizes.lg];
  return lines(
    "## Icons",
    "",
    `${tw ? `Use \`lucide-react\` only, with \`strokeWidth={${icons.strokeWidth}}\`.` : `Use inline SVG copied from lucide with \`stroke-width="${icons.strokeWidth}"\`.`} Sizes ${sizes.join(", ")}px${tw ? ` (\`size-${unit(sizes[0])}\`, \`size-${unit(sizes[1])}\`, \`size-${unit(sizes[2])}\`)` : ""}: ${sizes[0]} in buttons and inputs, ${sizes[1]} beside text and in icon tiles, ${sizes[2]} in empty states. Color is \`currentColor\`. An icon-only button needs an \`aria-label\`; an icon beside a label is \`aria-hidden\`. Never mix icon sets.${icons.style !== "outline" ? ` The chosen style is ${icons.style}; lucide draws outlines only, so match that look with the same stroke and sizes.` : ""}`,
    "",
  );
}
