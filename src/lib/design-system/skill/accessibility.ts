import { lines, table, type SkillContext } from "./context";

export function accessibilitySection(ctx: SkillContext): string[] {
  const { colors, signature, controls, typography } = ctx.t;
  const pairs = colors.contrastPairs;
  const failing = pairs.filter((p) => !p.passes);
  // The input border is checked on five surfaces and the charts are five colors. One row each, at the worst case.
  const worst = (group: typeof pairs) => group.reduce((a, b) => (b.levels.ratio < a.levels.ratio ? b : a));
  const inputPairs = pairs.filter((p) => p.foregroundRole === "input");
  const chartPairs = pairs.filter((p) => p.foregroundRole.startsWith("chart-"));
  const single = pairs.filter((p) => !inputPairs.includes(p) && !chartPairs.includes(p));
  const row = (label: string, p: (typeof pairs)[number]) => [label, `${p.levels.ratio.toFixed(2)}:1`, `${p.required}:1`, p.passes ? "pass" : "FAIL"];
  const rows = [
    ...single.map((p) => row(p.label, p)),
    row(`input border on ${inputPairs.map((p) => p.backgroundRole.replace("tinted-tile", "tinted bento tile")).join(", ")} (lowest)`, worst(inputPairs)),
    row("chart 1 to 5 on background (lowest)", worst(chartPairs)),
  ];
  return lines(
    "## 5. Accessibility",
    "",
    "### Verified contrast",
    "",
    `Text pairs need 4.5:1. Interface parts (input outlines, focus rings, chart colors) need 3:1. Every pair below was measured from these exact tokens.${failing.length ? ` Pairs marked FAIL do not reach their target: do not use them for essential content.` : ""}`,
    "",
    ...table(["Pair", "Ratio", "Needs", "Result"], rows),
    "",
    "- Body text goes on `background`, `card`, `popover`, `muted` or `accent` using the matching foreground. Do not put text on any other surface or on a scale color without checking it.",
    `- White text on a filled color works from this step, and on darker ones: brand ${colors.reports.brand.guidance.whiteTextFrom ?? "none"}, success ${colors.reports.semantic.success.guidance.whiteTextFrom ?? "none"}, warning ${colors.reports.semantic.warning.guidance.whiteTextFrom ?? "none"}, error ${colors.reports.semantic.error.guidance.whiteTextFrom ?? "none"}, info ${colors.reports.semantic.info.guidance.whiteTextFrom ?? "none"}. Dark text works on lighter steps, up to brand ${colors.reports.brand.guidance.darkTextUpTo ?? "none"}.`,
    "",
    "### Focus, motion, targets",
    "",
    `- Every interactive element shows the focus ring (${signature.focusRing.label.toLowerCase()}). Never remove it, never rely on color alone for focus.`,
    `- ${signature.primaryCta.animated ? "The animated glow stops under `prefers-reduced-motion` and becomes a steady border." : "Motion is limited to small hover transitions."} Never add autoplaying motion without a reduced-motion fallback.`,
    `- Controls are at least ${controls.buttons.height.sm}px tall, ${controls.buttons.height.md}px by default. Keep ${ctx.t.spacing.semantic.inlineGap}px between neighbouring targets.`,
    `- Text is never below ${typography.sizes[0].px}px. Body text is ${typography.sizes.find((s) => s.name === "base")!.px}px.`,
    "- State is never color alone: errors have text, success has text, status has an icon or label.",
    "- Use real elements: `button` for actions, `a` for navigation, `label` for fields, `th scope` for table headers. Keep a logical heading order.",
    "",
  );
}
