import { SYSTEM_STACKS, nearestWeight } from "../fonts";
import { selectedFontsUrl } from "../font-loading";
import { SCALE_STEPS, type ColorScale, type FontToken, type SemanticName } from "../types";
import { fence, lines, remOf, shadowClass, unit, type SkillContext } from "./context";

/** Semantic scale steps written out. Enough for status text, badges and alerts. */
const SEMANTIC_STEPS = [50, 600, 700, 800] as const;
/** Steps of the optional secondary scale: fills 100 to 300, text 900, tints 50. */
const SECONDARY_STEPS = [50, 100, 200, 300, 900] as const;

/** Declarations packed several to a line, to keep long token lists short. */
const pack = (items: string[], perLine: number): string[] => {
  const out: string[] = [];
  for (let i = 0; i < items.length; i += perLine) out.push(`  ${items.slice(i, i + perLine).join(" ")}`);
  return out;
};

const scaleLines = (prefix: string, scale: ColorScale, name: string, steps: readonly number[] = SCALE_STEPS) =>
  pack(steps.map((step) => `${prefix}${name}-${step}: ${scale[step as keyof ColorScale]};`), 5);

// ─────────────────────────────────────────────────────────────
// Fonts
// ─────────────────────────────────────────────────────────────

interface FontSlot {
  role: "heading" | "body" | "mono";
  token: FontToken;
  weights: number[];
}

function fontSlots(ctx: SkillContext): FontSlot[] {
  const { typography: ty } = ctx.t;
  const bodyWeights = [...new Set([ty.bodyWeight, ty.weights.regular, ty.weights.medium, ty.weights.semibold, ty.weights.bold])].sort((a, b) => a - b);
  const slots: FontSlot[] = [
    { role: "heading", token: ty.heading, weights: [ty.headingWeight] },
    { role: "body", token: ty.body, weights: bodyWeights },
  ];
  if (ty.mono) slots.push({ role: "mono", token: ty.mono, weights: [nearestWeight(400, ty.mono.offeredWeights), nearestWeight(700, ty.mono.offeredWeights)] });
  return slots;
}

const nextFontName = (name: string) => name.replace(/ /g, "_");
const faceVar = (family: string) => `--font-${family.toLowerCase().replace(/ /g, "-")}-face`;

/** Font loading for the chosen stack: only the selected fonts, only the weights used, always display swap. */
function fontLoading(ctx: SkillContext): string[] {
  const slots = fontSlots(ctx);
  const brand = slots.filter((slot) => slot.token.source === "brand");

  if (ctx.stack === "next-tailwind-shadcn") {
    const families = new Map<string, Set<number>>();
    for (const slot of slots) {
      const family = slot.token.fallbackName ?? slot.token.name;
      const set = families.get(family) ?? new Set<number>();
      slot.weights.forEach((w) => set.add(w));
      families.set(family, set);
    }
    const code = [`import { ${[...families.keys()].map(nextFontName).join(", ")} } from "next/font/google";`];
    if (brand.length) code.push('import localFont from "next/font/local";');
    const names: string[] = [];
    for (const [family, weights] of families) {
      const id = `face${nextFontName(family)}`;
      names.push(id);
      code.push(`const ${id} = ${nextFontName(family)}({ subsets: ["latin"], weight: [${[...weights].sort((a, b) => a - b).map((w) => `"${w}"`).join(", ")}], variable: "${faceVar(family)}", display: "swap" });`);
    }
    for (const slot of brand) {
      const id = `brand${slot.role[0].toUpperCase()}${slot.role.slice(1)}`;
      names.push(id);
      code.push(`const ${id} = localFont({ src: "./fonts/${slot.token.name.replace(/ /g, "")}.woff2", variable: "--font-${slot.role}-brand-face", display: "swap" }); // licensed: add your own files`);
    }
    code.push(`// app/layout.tsx: <html className={\`${names.map((n) => `\${${n}.variable}`).join(" ")}\`}>`);
    return lines("**Fonts** (`app/layout.tsx`):", "", fence("tsx", code), "");
  }

  const url = selectedFontsUrl(ctx.t.typography);
  return lines(
    "**Fonts** (`index.html`, in `head`):",
    "",
    fence("html", url ? [`<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`, `<link rel="stylesheet" href="${url}">`] : []),
    brand.length ? `Licensed brand font: host the files yourself with \`@font-face\` and \`font-display: swap\`. The stack falls back to ${brand.map((b) => b.token.fallbackName).join(", ")}.` : null,
    "",
  );
}

function stackFor(ctx: SkillContext, role: "heading" | "body" | "mono"): string {
  const { typography: ty } = ctx.t;
  if (ctx.stack !== "next-tailwind-shadcn") return ty.stacks[role];
  const token = ty[role];
  if (!token) return ty.stacks.mono;
  const brandPart = token.source === "brand" ? `var(--font-${role}-brand-face), ` : "";
  return `${brandPart}var(${faceVar(token.fallbackName ?? token.name)}), ${SYSTEM_STACKS[token.category]}`;
}

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────

/** Roles grouped the way they are used: a surface and its text on one line. */
const ROLE_GROUPS: (readonly string[])[] = [
  ["background", "foreground"],
  ["card", "card-foreground", "card-border"],
  ["popover", "popover-foreground"],
  ["primary", "primary-foreground"],
  ["secondary", "secondary-foreground"],
  ["muted", "muted-foreground"],
  ["accent", "accent-foreground"],
  ["destructive", "destructive-foreground"],
  ["border", "input", "ring"],
  ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"],
  ["sidebar", "sidebar-foreground"],
  ["sidebar-primary", "sidebar-primary-foreground"],
  ["sidebar-accent", "sidebar-accent-foreground"],
  ["sidebar-border", "sidebar-ring"],
];
/** Roles shadcn does not define. Everything else is mapped to a Tailwind color by `shadcn init`. */
const CUSTOM_ROLES = ["card-border", "placeholder", "primary-hover", "primary-pressed", "destructive-hover", "destructive-pressed"];

function roleVars(ctx: SkillContext, withRadius: boolean, prefix = "--"): string[] {
  const { colors, controls, radius } = ctx.t;
  const v = controls.buttons.variants;
  const role = (name: string) => `${prefix}${name}: ${colors.roles[name as keyof typeof colors.roles]};`;
  return lines(
    "  /* Roles (shadcn names) and derived button states. Replace the values init wrote */",
    ROLE_GROUPS.map((group) => `  ${group.map(role).join(" ")}`),
    `  ${prefix}placeholder: ${colors.placeholder};${withRadius ? ` --radius: ${radius.md}px;` : ""} ${prefix}primary-hover: ${v.primary.hover.background}; ${prefix}primary-pressed: ${v.primary.pressed.background};`,
    `  ${prefix}destructive-hover: ${v.destructive.hover.background}; ${prefix}destructive-pressed: ${v.destructive.pressed.background};`,
  );
}

function tailwindCss(ctx: SkillContext): string[] {
  const { colors, typography: ty, radius, elevation } = ctx.t;
  const tracking = (step: number) => ty.sizes.find((s) => s.step === step)!.letterSpacing;
  const shadcn = ctx.shadcn;
  const map = (names: string[]) => pack(names.map((r) => `--color-${r}: var(--${r});`), 3);
  const bodyStack = stackFor(ctx, "body");
  const headingStack = stackFor(ctx, "heading");
  const fontBlock = [
    `  --font-sans: ${bodyStack};`,
    `  --font-heading: ${headingStack === bodyStack ? "var(--font-sans)" : headingStack};`,
    `  --font-mono: ${stackFor(ctx, "mono")};`,
  ];
  const common = lines(
    scaleLines("--color-", colors.brand, "brand"),
    scaleLines("--color-", colors.neutral, "neutral"),
    colors.secondary ? scaleLines("--color-", colors.secondary, "secondary", SECONDARY_STEPS) : null,
    (Object.keys(colors.semantic) as SemanticName[]).flatMap((name) => scaleLines("--color-", colors.semantic[name], name, SEMANTIC_STEPS)),
    `  --radius-sm: ${radius.sm}px; --radius-md: ${radius.md}px; --radius-lg: ${radius.lg}px; --radius-full: ${radius.full}px;`,
    pack(ty.sizes.map((size) => `--text-${size.name}: ${remOf(size.px)}; --text-${size.name}--line-height: ${remOf(size.lineHeightPx)};`), 2),
    `  --tracking-heading: ${tracking(3)}; --tracking-heading-sm: ${tracking(2)}; --tracking-heading-xs: ${tracking(1)};`,
    elevation.shadows.filter((s) => s.level > 0).map((s) => `  --shadow-${["xs", "sm", "md", "lg", "xl"][s.level - 1]}: ${s.css};`),
  );

  if (!shadcn) {
    // Plain React + Tailwind: no shadcn to write mappings, so every color is a theme variable.
    return lines(
      '@import "tailwindcss";',
      "",
      "@theme {",
      "  /* Remove Tailwind's defaults, so only these tokens exist */",
      "  --color-*: initial; --text-*: initial; --shadow-*: initial;",
      roleVars(ctx, false, "--color-"),
      common,
      fontBlock,
      "}",
      "",
      "@layer base {",
      "  body { background: var(--color-background); color: var(--color-foreground); font-family: var(--font-sans); }",
      "  h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); }",
      "}",
    );
  }

  // shadcn stack. The order of these blocks matters, so it is written into the code itself.
  const radiusLine = `  --radius-sm: ${radius.sm}px; --radius-md: ${radius.md}px; --radius-lg: ${radius.lg}px; --radius-full: ${radius.full}px;`;
  const commonNoRadius = common.filter((line) => !line.includes("--radius-sm:"));
  return lines(
    ":root {",
    roleVars(ctx, true),
    "}",
    "",
    "@theme {",
    "  /* FIRST, above shadcn's own @theme inline block: the reset erases role mappings defined before it",
    "     (build error: Cannot apply unknown utility class `border-border`) */",
    "  --color-*: initial; --text-*: initial; --shadow-*: initial;",
    commonNoRadius,
    "}",
    "",
    "/* shadcn's @theme inline block (from init) stays here, untouched */",
    "",
    "@theme inline {",
    "  /* LAST, below shadcn's block, so radius and fonts win over its values. Custom role mappings: */",
    map(CUSTOM_ROLES),
    radiusLine,
    fontBlock,
    "}",
    "",
    "@layer base { h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); } }",
  );
}

function plainCss(ctx: SkillContext): string[] {
  const { colors, typography: ty, radius, elevation, spacing, controls } = ctx.t;
  return lines(
    ":root {",
    roleVars(ctx, false),
    scaleLines("--", colors.brand, "brand"),
    scaleLines("--", colors.neutral, "neutral"),
    colors.secondary ? scaleLines("--", colors.secondary, "secondary", SECONDARY_STEPS) : null,
    (Object.keys(colors.semantic) as SemanticName[]).flatMap((name) => scaleLines("--", colors.semantic[name], name, SEMANTIC_STEPS)),
    `  --font-heading: ${ty.stacks.heading};`,
    `  --font-body: ${ty.stacks.body};`,
    `  --font-mono: ${ty.stacks.mono};`,
    pack(ty.sizes.map((size) => `--text-${size.name}: ${remOf(size.px)}; --leading-${size.name}: ${remOf(size.lineHeightPx)};`), 2),
    `  --tracking-heading: ${ty.sizes.find((s) => s.step === 3)!.letterSpacing}; --tracking-heading-sm: ${ty.sizes.find((s) => s.step === 2)!.letterSpacing}; --tracking-heading-xs: ${ty.sizes.find((s) => s.step === 1)!.letterSpacing};`,
    `  --radius-sm: ${radius.sm}px; --radius-md: ${radius.md}px; --radius-lg: ${radius.lg}px; --radius-full: ${radius.full}px;`,
    elevation.shadows.filter((s) => s.level > 0).map((s) => `  --shadow-${s.level}: ${s.css};`),
    pack(spacing.scale.map((step) => `--space-${step.key.replace(".", "_")}: ${step.px}px;`), 6),
    `  --control-h-sm: ${controls.buttons.height.sm}px; --control-h: ${controls.buttons.height.md}px; --control-h-lg: ${controls.buttons.height.lg}px; --button-px: ${spacing.semantic.buttonPaddingX}px; --button-py: ${spacing.semantic.buttonPaddingY}px; --input-px: ${spacing.semantic.inputPaddingX}px; --input-py: ${spacing.semantic.inputPaddingY}px;`,
    "}",
    "body { margin: 0; background: var(--background); color: var(--foreground); font-family: var(--font-body); font-size: var(--text-base); line-height: var(--leading-base); }",
    "h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); }",
  );
}

// ─────────────────────────────────────────────────────────────
// The whole Tokens section
// ─────────────────────────────────────────────────────────────

export function tokensSection(ctx: SkillContext): string[] {
  const { typography: ty, radius, spacing, borders, elevation } = ctx.t;
  const tw = ctx.tailwind;
  const sp = (px: number) => (tw ? `\`${unit(px)}\`` : `${px}px`);
  const sizeLine = ty.sizes.map((s) => `${s.name} ${s.px}/${s.lineHeightPx}`).join(", ");
  const shadows = elevation.shadows
    .filter((s) => s.level > 0)
    .map((s) => `${tw ? `\`${shadowClass(s.level)}\`` : `\`--shadow-${s.level}\``} ${["resting cards", "raised cards, hover", "dropdowns, popovers", "dialogs", "toasts, drag and drop"][s.level - 1] ?? ""}`)
    .join("; ");

  return lines(
    "## Tokens",
    "",
    tw ? `### ${ctx.shadcn ? "globals.css" : "src/index.css"} (Tailwind 4: tokens live in CSS, no tailwind.config)` : "### styles.css",
    "",
    fence("css", tw ? tailwindCss(ctx) : plainCss(ctx)),
    "",
    fontLoading(ctx),
    "### Type, radius, spacing, borders, shadows",
    "",
    `- **Type** (px size/line height, all whole even sizes, line heights multiples of 4): ${sizeLine}. Use xs for captions, sm for labels and helper text, base for body, inputs and buttons, lg for card titles, xl for section titles, 2xl to 3xl for page titles, 4xl to 5xl for marketing only.`,
    `- **Fonts:** headings ${ty.heading.name} ${ty.headingWeight}${tw ? " (`font-heading`)" : ""}, body ${ty.body.name} ${ty.bodyWeight}, labels and buttons ${ty.weights.medium}${ty.mono ? `, mono ${ty.mono.name}` : ", code in the system monospace stack"}. Heading tracking: ${tw ? "`tracking-heading` from 2xl up, `-sm` at xl, `-xs` at lg" : "`--tracking-heading` from 2xl up, `-sm` at xl, `-xs` at lg"}. Body text has no tracking.`,
    `- **Tabular numbers:** ${tw ? `\`${ty.tabularNumbers.className}\`` : "`font-variant-numeric: tabular-nums`"} on any column of numbers, price or metric. Right align numbers.`,
    `- **Radius:** sm ${radius.sm}px ${tw ? "`rounded-sm`" : ""} checkboxes; md ${radius.md}px ${tw ? "`rounded-md`" : ""} buttons, inputs, selects, icon tiles; lg ${radius.lg}px ${tw ? "`rounded-lg`" : ""} cards, dialogs, popovers; full ${tw ? "`rounded-full`" : ""} radios, switches, avatars, badges.${tw ? "" : " Variables: `--radius-sm` to `--radius-full`."}`,
    `- **Spacing** (${spacing.base}px grid, ${spacing.density}): ladder ${spacing.scale.map((s) => s.px).join(", ")}px${tw ? "; the class number is px divided by 4 (16px is `p-4`)" : " as `--space-N`"}. Inline gap ${sp(spacing.semantic.inlineGap)}, stack gap ${sp(spacing.semantic.stackGap)}, button padding ${sp(spacing.semantic.buttonPaddingX)} by ${sp(spacing.semantic.buttonPaddingY)}, input padding ${sp(spacing.semantic.inputPaddingX)} by ${sp(spacing.semantic.inputPaddingY)}, card padding ${sp(spacing.semantic.cardPadding)}, section gap ${sp(spacing.semantic.sectionGap)}.`,
    `- **Borders** ${borders.width}px. Dividers and card edges use ${tw ? "`border-border`" : "`var(--border)`"}. Form controls use ${tw ? "`border-input`" : "`var(--input)`"}, the lightest neutral that reaches 3:1 on every surface. Never \`border\` on a form control.`,
    `- **Shadows:** ${elevation.levels === 0 ? "off. Separate surfaces with borders and tints." : `${elevation.levels} levels, ${elevation.style}. ${shadows}.`}`,
    "",
  );
}
