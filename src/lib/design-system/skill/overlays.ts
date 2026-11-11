import { onTint, compactCss, fence, lines, shadowClass, spaceVar, unit, weightClass, type SkillContext, tight } from "./context";
import { maxWidthClass } from "./layout-nav";
import { statusTextClass } from "./components";
import type { SemanticName } from "../types";


/** Overlays and feedback for plain CSS: variables and classes the file defines, with no Tailwind names. */
function overlaysCss(ctx: SkillContext): string[] {
  const { colors, layout, elevation } = ctx.t;
  const r = colors.roles;
  const lvl = (n: number) => `var(--shadow-${Math.min(n, elevation.levels)})`;
  const shadow = (n: number) => (elevation.levels > 0 ? `box-shadow: ${lvl(n)}; ` : "");
  const pct = Math.round(layout.overlayOpacity * 100);
  const popover = `border: var(--border-w) solid ${ctx.cssVar(r.border, "border", ["border"])}; border-radius: var(--radius-lg); background: ${ctx.cssVar(r.popover, "fill", ["popover"])}; color: ${ctx.cssVar(r["popover-foreground"], "text", ["popover-foreground"])};`;
  const muted = ctx.cssVar(r["muted-foreground"], "text");
  const fg = ctx.cssVar(r.foreground, "text", ["foreground"]);
  const css = [
    `.overlay { position: fixed; inset: 0; background: color-mix(in srgb, ${fg} ${pct}%, transparent); }`,
    `.dialog, .toast { ${popover} }`,
    `.dialog { position: fixed; inset: 50% auto auto 50%; width: min(var(--dialog-w), 100%); padding: var(--pad-card); transform: translate(-50%, -50%); ${shadow(5)}}`,
    `.dialog__desc { margin: ${spaceVar(ctx, ctx.t.spacing.semantic.inlineGap / 2)} 0 0; font-size: var(--text-sm); color: ${muted}; }`,
    `.dialog__footer { display: flex; justify-content: flex-end; gap: var(--gap-inline); margin-top: var(--pad-card); }`,
    `.toast { display: flex; gap: var(--gap-stack); padding: var(--gap-stack); ${shadow(4)}} .toast__icon { color: var(--tone); }`,
    `.tabs { display: flex; gap: var(--gap-stack); border-bottom: var(--border-w) solid ${ctx.cssVar(r.border, "border", ["border"])}; } .tab { height: var(--control-h); padding: 0 var(--input-px); border: 0; border-bottom: ${spaceVar(ctx, 2)} solid transparent; background: none; color: ${muted}; font: ${ctx.t.controls.buttons.fontWeight} var(--text-sm) var(--font-body); cursor: pointer; } .tab[aria-selected="true"] { color: ${fg}; border-bottom-color: ${ctx.cssVar(r.primary, "border", ["primary"])}; }`,
    `.badge { display: inline-flex; padding: ${spaceVar(ctx, 2)} var(--gap-inline); border-radius: var(--radius-full); background: var(--tint, ${ctx.cssVar(r.muted, "fill", ["muted"])}); color: var(--tone, ${muted}); font-size: var(--text-xs); font-weight: ${ctx.t.controls.buttons.fontWeight}; }`,
    `${([["brand", colors.brand], ...(["success", "warning", "error", "info"] as SemanticName[]).map((n) => [n, colors.semantic[n]] as const)] as const).map(([n, sc]) => `.tone-${n} { --tint: ${ctx.cssVar(sc[50], "fill")}; --tone: var(--${n}-${onTint(sc)}); }`).join(" ")}`,
    `.avatar { display: inline-flex; align-items: center; justify-content: center; width: var(--control-h); height: var(--control-h); border-radius: var(--radius-full); background: ${ctx.cssVar(r.muted, "fill", ["muted"])}; color: ${muted}; }`,
    `.skeleton { border-radius: var(--radius-md); background: ${ctx.cssVar(r.muted, "fill", ["muted"])}; animation: ds-pulse 2s ease-in-out infinite; } @keyframes ds-pulse { 50% { opacity: 0.5; } } @media (prefers-reduced-motion: reduce) { .skeleton { animation: none; } }`,
  ];
  return css;
}

function overlaysHtml(ctx: SkillContext): string[] {
  const { elevation } = ctx.t;
  const lvl = (n: number) => (elevation.levels > 0 ? `\`--shadow-${Math.min(n, elevation.levels)}\`` : "no shadow");
  return lines(
    "## Overlays and feedback",
    "",
    `Floating layers use the \`popover\` colors (not the tinted \`card\`), \`--radius-lg\` and shadows ${lvl(3)} (popovers), ${lvl(4)} (dialogs), ${lvl(5)} (toasts). **Dialog:** \`.overlay\` behind \`.dialog\` (an \`h2\` title, \`.dialog__desc\`, \`.dialog__footer\`): tertiary Cancel, one primary action (destructive for deletes); focus trapped, Escape closes. **Toast:** \`.toast\` with a tone class (\`.tone-success\`, \`-error\`, \`-warning\`, \`-info\`); \`role="status"\` (\`alert\` for errors); only non-critical toasts auto-dismiss. **Tabs:** \`role="tab"\`, \`aria-selected\`. **Badge:** plain or with a tone class (\`.tone-brand\` too); a label, never a button. **Skeleton:** shaped like the content it replaces; never a page-wide spinner.`,
    "",
    fence("css", tight(ctx, compactCss(overlaysCss(ctx).join("\n"), 600).split("\n"))),
    "",
  );
}

export function overlaysSection(ctx: SkillContext): string[] {
  if (!ctx.tailwind) return overlaysHtml(ctx);
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
    `Floating layers use the \`popover\` role (never the tinted \`card\`), radius lg, the focus ring, \`icon-tile\` for icons, and a shadow for their height: popovers ${level(3)}, toasts ${level(4)}, dialogs ${level(5)}. Fades stop under reduced motion (${tw ? "`motion-reduce:transition-none`" : "`prefers-reduced-motion`"}).`,
    "",
    `- **Dialog:** ${tw ? `\`${maxWidthClass(layout.dialogWidth)} rounded-lg border border-border bg-popover text-popover-foreground ${level(5)} p-${unit(spacing.semantic.cardPadding)}\`` : `${layout.dialogWidth}px wide, popover colors, radius lg, shadow 5, padding ${spacing.semantic.cardPadding}px`} over \`${tw ? `bg-foreground/${pct}` : `foreground at ${pct}%`}\`. Title \`${title}\`, description \`text-sm text-muted-foreground\`. Footer right aligned, ${spacing.semantic.inlineGap}px gaps: tertiary Cancel, one primary action (destructive for deletes). Focus is trapped; Escape closes.`,
    `- **Toast:** the dialog surface with ${tw ? `\`${level(4)} p-${unit(spacing.semantic.stackGap)}\`` : "shadow 4"}. Title \`text-sm font-medium\`, description muted. Status icon in ${["success", "error", "warning", "info"].map((n) => `\`${statusTextClass(ctx, n as SemanticName)}\``).join(", ")}. \`role="status"\`, or \`role="alert"\` for errors. Only non-critical toasts auto-dismiss.`,
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
    `${tw ? `Use \`lucide-react\` only, with \`strokeWidth={${icons.strokeWidth}}\`.` : `Use inline SVG copied from lucide with \`stroke-width="${icons.strokeWidth}"\`.`} Sizes ${sizes.join(", ")}px${tw ? ` (\`size-${unit(sizes[0])}\`, \`size-${unit(sizes[1])}\`, \`size-${unit(sizes[2])}\`)` : ""}: ${sizes[0]} in buttons and inputs, ${sizes[1]} beside text and in icon tiles, ${sizes[2]} in empty states. An icon-only button needs an \`aria-label\`; an icon beside a label is \`aria-hidden\`.${ctx.tailwind && !ctx.shadcn ? " The checkbox tick (`strokeWidth={3}`, 12px) is the only exception." : ""}${icons.style !== "outline" ? ` The chosen style is ${icons.style}; lucide draws outlines only, so match that look with the same stroke and sizes.` : ""}`,
    "",
  );
}
