import { SYSTEM_STACKS, nearestWeight } from "../fonts";
import { selectedFontsUrl } from "../font-loading";
import { SCALE_STEPS, type ColorScale, type FontToken, type SemanticName } from "../types";
import { compactCss, fence, lines, recipeLines, remOf, shadowClass, spaceVar, tightCss, unit, type SkillContext } from "./context";

/** Semantic scale steps written out. Enough for status text, badges and alerts. */
const SEMANTIC_STEPS = [50, 600, 700, 800] as const;
/** A tinted destructive button (brand near the error red) also needs the error 100 and 200 tints for hover and pressed. */
const semanticSteps = (ctx: SkillContext, name: SemanticName): readonly (50 | 100 | 200 | 600 | 700 | 800)[] =>
  name === "error" && ctx.t.controls.buttons.destructiveStyle === "tinted" ? [50, 100, 200, 600, 700, 800] : SEMANTIC_STEPS;
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
    brand.length ? `Licensed brand font: host the files yourself (\`@font-face\`, \`font-display: swap\`). Fallbacks: ${brand.map((b) => b.token.fallbackName).join(", ")}.` : null,
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
  const solid = controls.buttons.destructiveSolid;
  const role = (name: string) => `${prefix}${name}: ${colors.roles[name as keyof typeof colors.roles]};`;
  return lines(
    ctx.shadcn ? "  /* Roles (shadcn names) and derived button states. Replace the values init wrote */" : "  /* Roles and button states */",
    ROLE_GROUPS.map((group) => `  ${group.map(role).join(" ")}`),
    `  ${prefix}placeholder: ${colors.placeholder};${withRadius ? ` --radius: ${radius.md}px;` : ""} ${prefix}primary-hover: ${v.primary.hover.background}; ${prefix}primary-pressed: ${v.primary.pressed.background};`,
    `  ${prefix}destructive-hover: ${solid.hover.background}; ${prefix}destructive-pressed: ${solid.pressed.background};`,
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
    (Object.keys(colors.semantic) as SemanticName[]).flatMap((name) => scaleLines("--color-", colors.semantic[name], name, semanticSteps(ctx, name))),
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
      `  ${autofillRule(ctx)}`,
      "}",
    );
  }

  // shadcn stack. The order of these blocks matters, so it is written into the code itself.
  const radiusLine = `  --radius-sm: ${radius.sm}px; --radius-md: ${radius.md}px; --radius-lg: ${radius.lg}px; --radius-full: ${radius.full}px;`;
  const commonNoRadius = common.filter((line) => !line.includes("--radius-sm:"));
  return lines(
    "/* Order in globals.css: 1 imports, 2 this @theme (with the reset), 3 shadcn's own @theme inline, 4 the final @theme inline, 5 :root values, 6 the base layer rule */",
    "@theme {",
    "  /* Must come before shadcn's block: the reset erases earlier role mappings (build error: unknown utility `border-border`) */",
    "  --color-*: initial; --text-*: initial; --shadow-*: initial;",
    commonNoRadius,
    "}",
    "",
    "/* (3) shadcn's @theme inline block from init stays here, untouched */",
    "",
    "@theme inline {",
    "  /* Must come after shadcn's block, so radius and fonts win. Custom role mappings: */",
    map(CUSTOM_ROLES),
    radiusLine,
    fontBlock,
    "}",
    "",
    ":root {",
    roleVars(ctx, true),
    "}",
    "",
    "@layer base {",
    "  h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); }",
    `  ${autofillRule(ctx)}`,
    "}",
  );
}

/** Keeps autofilled fields in the token colors: browsers paint their own background and text color otherwise. */
function autofillRule(ctx: SkillContext): string {
  const field = ctx.t.controls.inputs.states.default;
  return `:-webkit-autofill { -webkit-text-fill-color: ${ctx.cssVar(field.color, "text", ["foreground"])}; box-shadow: 0 0 0 1000px ${ctx.cssVar(field.background, "fill", ["background"])} inset; }`;
}

function plainCss(ctx: SkillContext): string[] {
  const { colors, typography: ty, radius, elevation, spacing, controls } = ctx.t;
  const sel = controls.selection;
  const switchPad = (sel.switch.height - 2 * sel.borderWidth - sel.switch.thumb) / 2;
  const switchTravel = sel.switch.width - 2 * sel.borderWidth - 2 * switchPad - sel.switch.thumb;
  // Table row height: input padding twice plus the base line height.
  const rowHeight = spacing.semantic.inputPaddingY * 2 + ty.sizes.find((size) => size.name === "base")!.lineHeightPx;
  return lines(
    ":root {",
    roleVars(ctx, false),
    scaleLines("--", colors.brand, "brand"),
    scaleLines("--", colors.neutral, "neutral"),
    colors.secondary ? scaleLines("--", colors.secondary, "secondary", SECONDARY_STEPS) : null,
    (Object.keys(colors.semantic) as SemanticName[]).flatMap((name) => scaleLines("--", colors.semantic[name], name, semanticSteps(ctx, name))),
    `  --font-heading: ${ty.stacks.heading};`,
    `  --font-body: ${ty.stacks.body === ty.stacks.heading ? "var(--font-heading)" : ty.stacks.body};`,
    `  --font-mono: ${ty.stacks.mono};`,
    pack(ty.sizes.map((size) => `--text-${size.name}: ${remOf(size.px)}; --leading-${size.name}: ${remOf(size.lineHeightPx)};`), 2),
    `  --tracking-heading: ${ty.sizes.find((s) => s.step === 3)!.letterSpacing}; --tracking-heading-sm: ${ty.sizes.find((s) => s.step === 2)!.letterSpacing}; --tracking-heading-xs: ${ty.sizes.find((s) => s.step === 1)!.letterSpacing};`,
    `  --radius-sm: ${radius.sm}px; --radius-md: ${radius.md}px; --radius-lg: ${radius.lg}px; --radius-full: ${radius.full}px;`,
    elevation.shadows.filter((s) => s.level > 0).map((s) => `  --shadow-${s.level}: ${s.css};`),
    pack(spacing.scale.map((step) => `--space-${step.key.replace(".", "_")}: ${step.px}px;`), 6),
    `  --control-h-sm: ${controls.buttons.height.sm}px; --control-h: ${controls.buttons.height.md}px; --control-h-lg: ${controls.buttons.height.lg}px; --button-px: ${spacing.semantic.buttonPaddingX}px; --button-py: ${spacing.semantic.buttonPaddingY}px; --input-px: ${spacing.semantic.inputPaddingX}px; --input-py: ${spacing.semantic.inputPaddingY}px;`,
    `  --border-w: ${ctx.t.borders.width}px; --gap-inline: ${spaceVar(ctx, spacing.semantic.inlineGap)}; --gap-stack: ${spaceVar(ctx, spacing.semantic.stackGap)}; --pad-card: ${spaceVar(ctx, spacing.semantic.cardPadding)}; --gap-section: ${spaceVar(ctx, spacing.semantic.sectionGap)};`,
    `  --check-size: ${sel.size}px; --mark-size: ${sel.size - 4}px; --dot-size: ${Math.round(sel.size / 2.5 / 2) * 2}px; --switch-w: ${sel.switch.width}px; --switch-h: ${sel.switch.height}px; --switch-thumb: ${sel.switch.thumb}px; --switch-pad: ${switchPad}px; --switch-travel: ${switchTravel}px; --row-h: ${rowHeight}px;`,
    `  --header-h: ${ctx.t.layout.headerHeight}px; --sidebar-w: ${ctx.t.layout.sidebar.width}px; --content-max: ${ctx.t.layout.maxContentWidth}px; --dialog-w: ${ctx.t.layout.dialogWidth}px;`,
    "}",
    "*, *::before, *::after { box-sizing: border-box; }",
    "body { margin: 0; background: var(--background); color: var(--foreground); font-family: var(--font-body); font-size: var(--text-base); line-height: var(--leading-base); }",
    "h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); }",
    // Automatic focus ring: the offset ring from the signature details, on every control and link.
    compactCss([":focus-visible {", ...recipeLines(ctx, ctx.t.signature.focusRing.css), "}"].join("\n"), 400).split("\n"),
    autofillRule(ctx),
  );
}

// ─────────────────────────────────────────────────────────────
// The whole Tokens section
// ─────────────────────────────────────────────────────────────

/** One line, only when the user assigned roles by hand. Never in a default file, so sizes stay as they are. */
function customRolesLine(ctx: SkillContext): string[] {
  const names = Object.keys(ctx.s.colors.roleOverrides ?? {});
  // Names only: the values are already in the tokens above.
  return names.length === 0 ? [] : [`Custom roles (never change them): ${names.join(", ")}.`, ""];
}

export function tokensSection(ctx: SkillContext): string[] {
  const { typography: ty, radius, spacing, borders, elevation } = ctx.t;
  const tw = ctx.tailwind;
  const sp = (px: number) => (tw ? `\`${unit(px)}\`` : `${px}px`);
  const shadows = elevation.shadows
    .filter((s) => s.level > 0)
    .map((s) => `${tw ? `\`${shadowClass(s.level)}\`` : `\`--shadow-${s.level}\``} ${["resting cards", "raised cards, hover", "dropdowns, popovers", "toasts", "dialogs, drag and drop"][s.level - 1] ?? ""}`)
    .join("; ");

  return lines(
    "## Tokens",
    "",
    tw ? `### ${ctx.shadcn ? "globals.css" : "src/index.css"} (Tailwind 4: tokens live in CSS, no tailwind.config)` : "### styles.css (all CSS lives here: tokens, components, signature details)",
    "",
    fence("css", tightCss(tw ? tailwindCss(ctx) : plainCss(ctx))),
    "",
    // Role assignments made by hand are part of the system: the file says which ones, and not to change them.
    ...customRolesLine(ctx),
    fontLoading(ctx),
    "### Type, radius, spacing, borders, shadows",
    "",
    `- **Type** (${ty.sizes[0].px}px to ${ty.sizes[ty.sizes.length - 1].px}px, line heights in the tokens above, multiples of 4px). xs captions, sm labels and helper text, base body, inputs and buttons, lg card titles, xl section titles, 2xl to 3xl page titles, 4xl to 5xl marketing only.`,
    `- **Fonts:** headings ${ty.heading.name} ${ty.headingWeight}${tw ? " (`font-heading`)" : ""}, body ${ty.body.name} ${ty.bodyWeight}, labels and buttons ${ty.weights.medium}${ty.mono ? `, mono ${ty.mono.name}` : ", code in the system monospace stack"}. Heading tracking: ${tw ? "`tracking-heading` from 2xl up, `-sm` at xl, `-xs` at lg" : "`--tracking-heading` from 2xl up, `-sm` at xl, `-xs` at lg"}.`,
    `- **Tabular numbers:** ${tw ? `\`${ty.tabularNumbers.className}\`` : "`font-variant-numeric: tabular-nums`"} on number columns, prices and metrics, right aligned.`,
    tw
      ? `- **Radius:** sm ${radius.sm}px \`rounded-sm\` checkboxes; md ${radius.md}px \`rounded-md\` buttons, inputs, selects, icon tiles; lg ${radius.lg}px \`rounded-lg\` cards, dialogs, popovers; full \`rounded-full\` radios, switches, avatars, badges.`
      : `- **Radius:** \`--radius-sm\` ${radius.sm}px checkboxes; \`--radius-md\` ${radius.md}px buttons, inputs, selects, icon tiles; \`--radius-lg\` ${radius.lg}px cards, dialogs, popovers; \`--radius-full\` radios, switches, avatars, badges.`,
    `- **Spacing** (${spacing.base}px grid, ${spacing.density}): ladder ${tw ? `${spacing.scale.map((s) => s.px).join(", ")}; the class number is px divided by 4 (16px is \`p-4\`)` : "`--space-N`"}. ${tw ? `Inline gap ${sp(spacing.semantic.inlineGap)}, stack gap ${sp(spacing.semantic.stackGap)}, button padding ${sp(spacing.semantic.buttonPaddingX)} by ${sp(spacing.semantic.buttonPaddingY)}, input padding ${sp(spacing.semantic.inputPaddingX)} by ${sp(spacing.semantic.inputPaddingY)}, card padding ${sp(spacing.semantic.cardPadding)}, section gap ${sp(spacing.semantic.sectionGap)}.` : `Roles: \`--gap-inline\`, \`--gap-stack\`, \`--button-px\` and \`--button-py\`, \`--input-px\` and \`--input-py\`, \`--pad-card\`, \`--gap-section\`.`}`,
    `- **Borders** ${borders.width}px. Dividers and card edges use ${tw ? "`border-border`" : "`var(--border)`"}. Form controls use ${tw ? "`border-input`" : "`var(--input)`"}. Never \`border\` on a form control.`,
    `- **Shadows:** ${elevation.levels === 0 ? "off. Separate surfaces with borders and tints." : `${elevation.levels} levels, ${elevation.style}. ${shadows}.`}`,
    "",
  );
}
