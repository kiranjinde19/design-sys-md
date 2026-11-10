import { lines, table, type SkillContext } from "./context";

export function accessibilitySection(ctx: SkillContext): string[] {
  const { colors, signature, controls } = ctx.t;
  const pairs = colors.contrastPairs;
  const worst = (group: typeof pairs) => group.reduce((a, b) => (b.levels.ratio < a.levels.ratio ? b : a));
  const grouped = (test: (role: string) => boolean) => pairs.filter((p) => test(p.foregroundRole));
  const inputPairs = grouped((r) => r === "input");
  const chartPairs = grouped((r) => r.startsWith("chart-"));
  const single = pairs.filter((p) => !inputPairs.includes(p) && !chartPairs.includes(p));
  const row = (label: string, p: (typeof pairs)[number]) => [label + (p.required === 3 ? " (3:1)" : ""), `${p.levels.ratio.toFixed(2)}:1${p.passes ? "" : " FAIL"}`];
  // Pairs that clear 7:1 (AAA) are listed on one line. The tighter ones get a row with their ratio.
  const strong = single.filter((p) => p.required === 4.5 && p.levels.ratio >= 7);
  const tight = single.filter((p) => !strong.includes(p));
  const rows = [
    ...tight.map((p) => row(p.label, p)),
    row(`input border on ${inputPairs.map((p) => p.backgroundRole.replace("tinted-tile", "tinted bento tile")).join(", ")} (lowest)`, worst(inputPairs)),
    row("chart 1 to 5 on background (lowest)", worst(chartPairs)),
  ];
  const guide = (name: "brand" | "success" | "warning" | "error" | "info") => (name === "brand" ? colors.reports.brand : colors.reports.semantic[name]).guidance.whiteTextFrom ?? "none";
  return lines(
    "## Accessibility",
    "",
    "Every pair was measured from these tokens and passes (text needs 4.5:1, interface parts 3:1). Use no other pair without checking it.",
    "",
    `At 7:1 or more (AAA, lowest ${worst(strong).levels.ratio.toFixed(2)}:1), each text color on its own surface: ${strong.map((p) => (p.foregroundRole === "foreground" ? "foreground on background" : p.foregroundRole === `${p.backgroundRole}-foreground` ? p.backgroundRole : p.label)).join(", ")}.`,
    "",
    ...table(["Pair", "Ratio"], rows),
    "",
    `- White text on a filled color works from this step and darker: ${(["brand", "success", "warning", "error", "info"] as const).map((n) => `${n} ${guide(n)}`).join(", ")}.`,
    `- Every interactive element shows the focus ring (${signature.focusRing.label.toLowerCase()}), never removed. Controls are at least ${controls.buttons.height.sm}px tall, ${ctx.t.spacing.semantic.inlineGap}px apart.`,
    "- State is never color alone. Use real elements (`button`, `a`, `label`, `th scope`), a logical heading order, and alt text or a decorative mark on every image.",
    "",
  );
}
