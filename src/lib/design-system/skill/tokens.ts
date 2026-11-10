import { nearestWeight } from "../fonts";
import { selectedFontsUrl } from "../font-loading";
import { SCALE_STEPS, type ColorScale, type FontToken, type SemanticName } from "../types";
import { SYSTEM_STACKS } from "../fonts";
import { fence, lines, remOf, shadowClass, table, unit, type SkillContext } from "./context";

/** Semantic scale steps written out. Enough for alerts, badges and status text. */
const SEMANTIC_STEPS = [50, 600, 700, 800] as const;

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
  return [...slots];
}

const nextFontName = (name: string) => name.replace(/ /g, "_");
const quoteList = (items: (string | number)[]) => `[${items.map((i) => `"${i}"`).join(", ")}]`;

/** Font loading for the chosen stack. Only the selected fonts, only the weights used, always display swap. */
export function fontLoading(ctx: SkillContext): string[] {
  const slots = fontSlots(ctx);
  const brand = slots.filter((slot) => slot.token.source === "brand");

  if (ctx.stack === "next-tailwind-shadcn") {
    // One next/font instance per distinct Google font, with the weights every role needs.
    const families = new Map<string, Set<number>>();
    for (const slot of slots) {
      const family = slot.token.fallbackName ?? slot.token.name;
      const set = families.get(family) ?? new Set<number>();
      slot.weights.forEach((w) => set.add(w));
      families.set(family, set);
    }
    const varOf = new Map<string, string>();
    const code: string[] = [];
    const imports = [...families.keys()].map(nextFontName).join(", ");
    code.push(`import { ${imports} } from "next/font/google";`);
    if (brand.length) code.push('import localFont from "next/font/local";');
    code.push("");
    for (const [family, weights] of families) {
      const id = `face${nextFontName(family)}`;
      varOf.set(family, id);
      code.push(`const ${id} = ${nextFontName(family)}({`, '  subsets: ["latin"],', `  weight: ${quoteList([...weights].sort((a, b) => a - b))},`, `  variable: "--font-${family.toLowerCase().replace(/ /g, "-")}-face",`, '  display: "swap",', "});");
    }
    for (const slot of brand) {
      code.push(`// Licensed brand font: you must hold the license and add the files yourself.`, `const brand${slot.role[0].toUpperCase()}${slot.role.slice(1)} = localFont({`, `  src: "./fonts/${slot.token.name.replace(/ /g, "")}.woff2", // path to your licensed file`, `  variable: "--font-${slot.role}-brand-face",`, '  display: "swap",', "});");
    }
    const classNames = [...varOf.values()].map((id) => `\${${id}.variable}`).concat(brand.map((slot) => `\${brand${slot.role[0].toUpperCase()}${slot.role.slice(1)}.variable}`));
    code.push("", "// app/layout.tsx: put the variables on <html>", `<html lang="en" className={\`${classNames.join(" ")}\`}>`);
    return lines("### Font loading (app/layout.tsx)", "", fence("tsx", code), "");
  }

  const url = selectedFontsUrl(ctx.t.typography);
  const link = url ? [`<link rel="preconnect" href="https://fonts.googleapis.com">`, `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`, `<link rel="stylesheet" href="${url}">`] : [];
  return lines(
    "### Font loading (index.html, inside head)",
    "",
    fence("html", link),
    brand.length ? `Licensed brand font: host the files yourself with \`@font-face\` and \`font-display: swap\`. The stack falls back to ${brand.map((b) => b.token.fallbackName).join(", ")}.` : null,
    "Load only these fonts and these weights. Do not add more.",
    "",
  );
}

/** The CSS stack for a role, as used in the theme. */
function stackFor(ctx: SkillContext, role: "heading" | "body" | "mono"): string {
  const { typography: ty } = ctx.t;
  if (ctx.stack !== "next-tailwind-shadcn") return role === "heading" ? ty.stacks.heading : role === "body" ? ty.stacks.body : ty.stacks.mono;
  const token = role === "heading" ? ty.heading : role === "body" ? ty.body : ty.mono;
  if (!token) return ty.stacks.mono;
  const family = (token.fallbackName ?? token.name).toLowerCase().replace(/ /g, "-");
  const system = SYSTEM_STACKS[token.category];
  const brandPart = token.source === "brand" ? `var(--font-${role}-brand-face), ` : "";
  return `${brandPart}var(--font-${family}-face), ${system}`;
}

// ─────────────────────────────────────────────────────────────
// CSS variables and Tailwind theme
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
];
const ROLE_ORDER = ROLE_GROUPS.flat();

function roleVars(ctx: SkillContext): string[] {
  const { colors, controls, radius } = ctx.t;
  const v = controls.buttons.variants;
  const role = (name: string) => `--${name}: ${colors.roles[name as keyof typeof colors.roles]};`;
  return lines(
    "  /* Roles (shadcn names), then derived states */",
    ROLE_GROUPS.map((group) => `  ${group.map(role).join(" ")}`),
    `  --placeholder: ${colors.placeholder}; --radius: ${radius.md}px;`,
    `  --primary-hover: ${v.primary.hover.background}; --primary-pressed: ${v.primary.pressed.background};`,
    `  --destructive-hover: ${v.destructive.hover.background}; --destructive-pressed: ${v.destructive.pressed.background};`,
  );
}

function themeBlock(ctx: SkillContext): string[] {
  const { colors, typography: ty, radius, elevation } = ctx.t;
  const sizeLines = ty.sizes.map((size) => `  --text-${size.name}: ${remOf(size.px)}; --text-${size.name}--line-height: ${remOf(size.lineHeightPx)};`);
  const tracking = (step: number) => ty.sizes.find((s) => s.step === step)!.letterSpacing;
  const shadowLines = elevation.shadows.filter((s) => s.level > 0).map((s) => `  --shadow-${["xs", "sm", "md", "lg", "xl"][s.level - 1]}: ${s.css};`);
  const inlineFonts = ctx.stack === "next-tailwind-shadcn";

  const roleMap = pack([...ROLE_ORDER, "placeholder", "primary-hover", "primary-pressed", "destructive-hover", "destructive-pressed"].map((r) => `--color-${r}: var(--${r});`), 3);
  const headingStack = stackFor(ctx, "heading");
  const bodyStack = stackFor(ctx, "body");
  const fontBlock = [
    `  --font-sans: ${bodyStack};`,
    `  --font-heading: ${headingStack === bodyStack ? "var(--font-sans)" : headingStack};`,
    `  --font-mono: ${stackFor(ctx, "mono")};`,
  ];

  return lines(
    '@import "tailwindcss";',
    "",
    ":root {",
    roleVars(ctx),
    "}",
    "",
    "@theme {",
    "  /* Remove Tailwind's defaults, so only these tokens exist */",
    "  --color-*: initial; --text-*: initial; --shadow-*: initial;",
    "  /* Scales */",
    scaleLines("--color-", colors.brand, "brand"),
    scaleLines("--color-", colors.neutral, "neutral"),
    colors.secondary ? scaleLines("--color-", colors.secondary, "secondary") : null,
    (Object.keys(colors.semantic) as SemanticName[]).flatMap((name) => scaleLines("--color-", colors.semantic[name], name, SEMANTIC_STEPS)),
    "  /* Radius */",
    `  --radius-sm: ${radius.sm}px; --radius-md: ${radius.md}px; --radius-lg: ${radius.lg}px; --radius-full: ${radius.full}px;`,
    "  /* Type scale: size and line height. Use text-xs to text-5xl */",
    sizeLines,
    "  /* Heading tracking: full from 2xl up, half at xl, a quarter at lg */",
    `  --tracking-heading: ${tracking(3)}; --tracking-heading-sm: ${tracking(2)}; --tracking-heading-xs: ${tracking(1)};`,
    "  /* Shadows: xs is level 1, xl is level 5 */",
    shadowLines,
    inlineFonts ? null : "  /* Fonts */",
    inlineFonts ? null : fontBlock,
    "}",
    "",
    "@theme inline {",
    "  /* Roles as Tailwind colors: bg-primary, text-foreground, border-input... */",
    roleMap,
    inlineFonts ? "  /* Fonts (the variables come from next/font) */" : null,
    inlineFonts ? fontBlock : null,
    "}",
    "",
    "@layer base {",
    "  body { background: var(--background); color: var(--foreground); font-family: var(--font-sans); }",
    "  h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); }",
    "}",
  );
}

// ─────────────────────────────────────────────────────────────
// Plain CSS tokens
// ─────────────────────────────────────────────────────────────

function plainCss(ctx: SkillContext): string[] {
  const { colors, typography: ty, radius, elevation, spacing, controls } = ctx.t;
  const semantic = (Object.keys(colors.semantic) as SemanticName[]).flatMap((name) => scaleLines("--", colors.semantic[name], name, SEMANTIC_STEPS));
  return lines(
    ":root {",
    roleVars(ctx).filter((line) => !line.includes("--radius:")).concat(`  --placeholder: ${colors.placeholder};`).filter((line, i, all) => all.indexOf(line) === i).map((line) => line.replace(/ --radius: [^;]+;/, "")),
    "  /* Scales */",
    scaleLines("--", colors.brand, "brand"),
    scaleLines("--", colors.neutral, "neutral"),
    colors.secondary ? scaleLines("--", colors.secondary, "secondary") : null,
    semantic,
    "  /* Fonts */",
    `  --font-heading: ${ty.stacks.heading};`,
    `  --font-body: ${ty.stacks.body};`,
    `  --font-mono: ${ty.stacks.mono};`,
    "  /* Type scale: size and line height */",
    ty.sizes.map((size) => `  --text-${size.name}: ${remOf(size.px)}; --leading-${size.name}: ${remOf(size.lineHeightPx)};`),
    `  --tracking-heading: ${ty.sizes.find((s) => s.step === 3)!.letterSpacing}; --tracking-heading-sm: ${ty.sizes.find((s) => s.step === 2)!.letterSpacing}; --tracking-heading-xs: ${ty.sizes.find((s) => s.step === 1)!.letterSpacing};`,
    "  /* Radius, shadows, spacing ladder, control sizes */",
    `  --radius-sm: ${radius.sm}px; --radius-md: ${radius.md}px; --radius-lg: ${radius.lg}px; --radius-full: ${radius.full}px;`,
    elevation.shadows.filter((s) => s.level > 0).map((s) => `  --shadow-${s.level}: ${s.css};`),
    pack(spacing.scale.map((step) => `--space-${step.key.replace(".", "_")}: ${step.px}px;`), 6),
    `  --control-h-sm: ${controls.buttons.height.sm}px; --control-h: ${controls.buttons.height.md}px; --control-h-lg: ${controls.buttons.height.lg}px;`,
    `  --button-px: ${spacing.semantic.buttonPaddingX}px; --button-py: ${spacing.semantic.buttonPaddingY}px; --input-px: ${spacing.semantic.inputPaddingX}px; --input-py: ${spacing.semantic.inputPaddingY}px;`,
    "}",
    "",
    "body { margin: 0; background: var(--background); color: var(--foreground); font-family: var(--font-body); font-size: var(--text-base); line-height: var(--leading-base); }",
    "h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); }",
  );
}

// ─────────────────────────────────────────────────────────────
// Public: the whole Tokens section
// ─────────────────────────────────────────────────────────────

export function tokensSection(ctx: SkillContext): string[] {
  const { typography: ty, radius, spacing, borders, elevation } = ctx.t;

  return lines(
    "## 1. Tokens",
    "",
    ctx.tailwind ? "### globals.css (Tailwind 4: all tokens live in CSS, there is no tailwind.config file)" : "### styles.css (all tokens)",
    "",
    ctx.shadcn ? "shadcn's `init` writes the same role names. Replace its values with these and keep the names." : null,
    ctx.shadcn ? "" : null,
    fence("css", ctx.tailwind ? themeBlock(ctx) : plainCss(ctx)),
    "",
    fontLoading(ctx),
    "### Type scale",
    "",
    `Heading font: ${ty.heading.name} ${ty.headingWeight}. Body font: ${ty.body.name} ${ty.bodyWeight}.${ty.mono ? ` Mono font: ${ty.mono.name}.` : " No mono font: code uses the system monospace stack."} Sizes are whole, even pixels. Line heights are multiples of 4px, tighter for headings.`,
    "",
    table(
      ["Size", "px", "rem", "Line height", "Heading tracking", "Use for"],
      ty.sizes.map((size) => [
        ctx.tailwind ? `\`text-${size.name}\`` : `\`--text-${size.name}\``,
        String(size.px),
        String(size.rem),
        `${size.lineHeightPx}px (${size.lineHeight})`,
        size.letterSpacing,
        { xs: "Captions, table meta", sm: "Helper text, labels", base: "Body, inputs, buttons", lg: "Card titles, lead text", xl: "Section titles", "2xl": "Page sections", "3xl": "Page titles", "4xl": "Hero headings", "5xl": "Marketing display" }[size.name] ?? "",
      ]),
    ),
    "",
    ctx.tailwind
      ? `Headings: \`font-heading font-semibold\` with tracking \`tracking-heading\` from 2xl up, \`tracking-heading-sm\` at xl, \`tracking-heading-xs\` at lg. Body text has no tracking. Heading weight is ${ty.headingWeight}, body is ${ty.bodyWeight}, labels and buttons are ${ty.weights.medium}.`
      : `Headings: \`font-family: var(--font-heading)\`, weight ${ty.headingWeight}, tracking \`var(--tracking-heading)\` from 2xl up, \`--tracking-heading-sm\` at xl, \`--tracking-heading-xs\` at lg. Body text has no tracking. Labels and buttons are weight ${ty.weights.medium}.`,
    "",
    "**Tabular numbers.** Any column of numbers, price or metric uses tabular figures so digits line up.",
    "",
    fence(ctx.tailwind ? "html" : "css", ctx.tailwind ? `<td class="text-right ${ty.tabularNumbers.className}">11,111.00</td>` : `.tabular { ${Object.values(ty.tabularNumbers.css).map((v) => `font-variant-numeric: ${v}`).join("; ")}; }`),
    "",
    "### Radius",
    "",
    table(["Token", "Value", ctx.tailwind ? "Class" : "Variable", "Use for"], [
      ["sm", `${radius.sm}px`, ctx.tailwind ? "`rounded-sm`" : "`--radius-sm`", "Checkboxes, small tags"],
      ["md", `${radius.md}px`, ctx.tailwind ? "`rounded-md`" : "`--radius-md`", "Buttons, inputs, selects, icon tiles"],
      ["lg", `${radius.lg}px`, ctx.tailwind ? "`rounded-lg`" : "`--radius-lg`", "Cards, dialogs, popovers"],
      ["full", "pill", ctx.tailwind ? "`rounded-full`" : "`--radius-full`", "Radios, switches, avatars, badges"],
    ]),
    "",
    "### Spacing",
    "",
    `Base grid ${spacing.base}px, ${spacing.density} density. The ladder, in px: ${spacing.scale.map((step) => step.px).join(", ")}. ${ctx.tailwind ? "In Tailwind the class number is px divided by 4: 16px is `p-4`, 6px is `p-1.5`." : "Variables are `--space-N`, where N is the px divided by the base."} Use only these.`,
    "",
    ...table(["Role", "px", ctx.tailwind ? "Class" : "Variable"], [
      ["Gap between inline items", String(spacing.semantic.inlineGap), ctx.tailwind ? `\`gap-${unit(spacing.semantic.inlineGap)}\`` : `\`--space-${String(spacing.semantic.inlineGap / spacing.base).replace(".", "_")}\``],
      ["Gap between stacked blocks", String(spacing.semantic.stackGap), ctx.tailwind ? `\`gap-${unit(spacing.semantic.stackGap)}\`` : `\`--space-${String(spacing.semantic.stackGap / spacing.base).replace(".", "_")}\``],
      ["Button padding (x, y)", `${spacing.semantic.buttonPaddingX}, ${spacing.semantic.buttonPaddingY}`, ctx.tailwind ? `\`px-${unit(spacing.semantic.buttonPaddingX)} py-${unit(spacing.semantic.buttonPaddingY)}\`` : "`--button-px`, `--button-py`"],
      ["Input padding (x, y)", `${spacing.semantic.inputPaddingX}, ${spacing.semantic.inputPaddingY}`, ctx.tailwind ? `\`px-${unit(spacing.semantic.inputPaddingX)} py-${unit(spacing.semantic.inputPaddingY)}\`` : "`--input-px`, `--input-py`"],
      ["Card padding", String(spacing.semantic.cardPadding), ctx.tailwind ? `\`p-${unit(spacing.semantic.cardPadding)}\`` : `\`--space-${String(spacing.semantic.cardPadding / spacing.base).replace(".", "_")}\``],
      ["Gap between page sections", String(spacing.semantic.sectionGap), ctx.tailwind ? `\`gap-${unit(spacing.semantic.sectionGap)}\`` : `\`--space-${String(spacing.semantic.sectionGap / spacing.base).replace(".", "_")}\``],
    ]),
    "",
    "### Borders and shadows",
    "",
    `Borders are ${borders.width}px. Decorative dividers and card edges use \`${ctx.tailwind ? "border-border" : "var(--border)"}\`. Form controls use \`${ctx.tailwind ? "border-input" : "var(--input)"}\` (the lightest neutral that reaches 3:1 on every surface). Never use \`border\` for a form control outline.`,
    "",
    elevation.levels === 0
      ? "Shadows are off. This is a flat design: separate surfaces with borders and tints."
      : [
          `${elevation.levels} shadow levels, ${elevation.style} style. Level 1 is the smallest. Use higher levels only for floating layers.`,
          "",
          elevation.shadows
            .filter((s) => s.level > 0)
            .map((s) => `${ctx.tailwind ? `\`${shadowClass(s.level)}\`` : `\`--shadow-${s.level}\``} ${["resting cards", "raised cards and hover", "dropdowns and popovers", "dialogs", "drag and drop, toasts"][s.level - 1] ?? ""}`)
            .join("; ") + ".",
        ],
    "",
  );
}
