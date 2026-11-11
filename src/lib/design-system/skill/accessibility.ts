import { contrastRatio } from "../contrast";
import type { SemanticName } from "../types";
import { lines, onTint, table, type SkillContext } from "./context";

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
  // Pairs that cards, badges and button states use. Each group shows its lowest ratio.
  const r = colors.roles;
  const ratio = (fg: string, bg: string) => contrastRatio(fg, bg);
  const low = (label: string, values: number[]) => [label, `${Math.min(...values).toFixed(2)}:1${Math.min(...values) >= 4.5 ? "" : " FAIL"}`];
  const tints = (["brand", "success", "warning", "error", "info"] as const).map((n) => {
    const scale = n === "brand" ? colors.brand : colors.semantic[n as SemanticName];
    const step = onTint(scale);
    return { n, step, v: ratio(scale[step], scale[50]) };
  });
  const variants = controls.buttons.variants;
  const states = (variant: "primary" | "destructive" | "secondary") => (["hover", "pressed"] as const).map((s) => ratio(variants[variant][s].color, variants[variant][s].background));
  const err = colors.semantic.error[700];
  const extra = [
    row("muted-foreground on card", { required: 4.5, levels: { ratio: ratio(r["muted-foreground"], r.card) }, passes: ratio(r["muted-foreground"], r.card) >= 4.5 } as (typeof pairs)[number]),
    low(`badge text on its 50 tint (${tints.every((t) => t.step === 700) ? "700" : "700, or 800 where 700 is lower"}): ${tints.map((t) => t.n).join(", ")} (lowest)`, tints.map((t) => t.v)),
    low("error-700 on background, card (lowest)", [ratio(err, r.background), ratio(err, r.card)]),
    low("primary-foreground on primary hover, pressed (lowest)", states("primary")),
    low("destructive-foreground on destructive hover, pressed (lowest)", states("destructive")),
    low("secondary-foreground on secondary hover, pressed (lowest)", states("secondary")),
  ];
  const rows = [
    ...tight.map((p) => row(p.label, p)),
    ...extra,
    row(`input border on ${inputPairs.map((p) => p.backgroundRole.replace("tinted-tile", "tinted bento tile")).join(", ")} (lowest)`, worst(inputPairs)),
    row("chart 1 to 5 on background (lowest)", worst(chartPairs)),
  ];
  const guide = (name: "brand" | "success" | "warning" | "error" | "info") => (name === "brand" ? colors.reports.brand : colors.reports.semantic[name]).guidance.whiteTextFrom ?? "none";
  return lines(
    "## Accessibility",
    "",
    "Every pair was measured from these tokens and passes (text needs 4.5:1, interface parts 3:1). Use no other pair without checking it.",
    "",
    `At 7:1 or more (lowest ${worst(strong).levels.ratio.toFixed(2)}:1): ${strong.map((p) => (p.foregroundRole === "foreground" ? "foreground on background" : p.foregroundRole === `${p.backgroundRole}-foreground` ? p.backgroundRole : p.label)).join(", ")}.`,
    "",
    ...table(["Pair", "Ratio"], rows),
    "",
    `- White text on a filled color works from this step and darker: ${(["brand", "success", "warning", "error", "info"] as const).map((n) => `${n} ${guide(n)}`).join(", ")}.`,
    `- Every interactive element shows the focus ring (${signature.focusRing.label.toLowerCase()}), never removed. Controls are at least ${controls.buttons.height.sm}px tall, ${ctx.t.spacing.semantic.inlineGap}px apart.`,
    "- State is never color alone. Use real elements (`button`, `a`, `label`, `th scope`), logical headings, and alt text on images.",
    "",
  );
}
