import { contrastRatio } from "../contrast";
import { buildVoiceSamples, sampleText } from "../voice";
import type { ButtonState, ButtonVariant, ControlStateStyle, InputState, SelectionControl, SelectionState, SemanticName } from "../types";
import {
  DENSITIES,
  compactCss,
  fence,
  lines,
  paintClasses,
  type PaintHints,
  readableStep,
  shadowClass,
  sizeName,
  spacingFor,
  table,
  unit,
  weightClass,
  type SkillContext,
} from "./context";

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "tertiary", "destructive"];
const STATES: ButtonState[] = ["default", "hover", "pressed", "disabled"];
const PREFIX: Partial<Record<ButtonState, string>> = { hover: "hover", pressed: "active", disabled: "disabled" };

const join = (parts: string[]) => parts.filter(Boolean).join(" ");

// ─────────────────────────────────────────────────────────────
// Colors for status text, picked so they pass 4.5:1 on the surfaces they sit on
// ─────────────────────────────────────────────────────────────

function statusText(ctx: SkillContext, name: SemanticName): string {
  const { colors } = ctx.t;
  const step = readableStep(colors.semantic[name], [colors.roles.background, colors.roles.card, colors.roles.muted], contrastRatio);
  return `text-${name}-${step}`;
}

// ─────────────────────────────────────────────────────────────
// Buttons
// ─────────────────────────────────────────────────────────────

/** Which token name to write when two tokens hold the same color: the one that matches the variant. */
const HINTS: Record<ButtonVariant, PaintHints> = {
  primary: { bg: ["primary", "muted"], text: ["primary-foreground"] },
  secondary: { bg: ["secondary", "muted"], text: ["secondary-foreground"], border: ["input"] },
  // Tertiary is defined as brand 600 text on brand 50 and 100, so it names the scale steps.
  tertiary: { bg: ["brand-50", "brand-100"], text: ["brand-600"] },
  destructive: { bg: ["destructive", "muted"], text: ["destructive-foreground"] },
};

function buttonVariantClasses(ctx: SkillContext, variant: ButtonVariant): string {
  const states = ctx.t.controls.buttons.variants[variant];
  const classes = [...paintClasses(ctx, states.default, "", undefined, HINTS[variant])];
  for (const state of ["hover", "pressed", "disabled"] as ButtonState[]) {
    classes.push(...paintClasses(ctx, states[state], PREFIX[state], states.default, HINTS[variant]));
  }
  return join(classes);
}

function buttonsSection(ctx: SkillContext): string[] {
  const { controls, spacing, typography } = ctx.t;
  const b = controls.buttons;
  const body = typography.sizes.find((size) => size.name === "base")!;
  const base = join([
    "inline-flex items-center justify-center",
    `gap-${unit(spacing.semantic.inlineGap)}`,
    "rounded-md border border-transparent",
    `text-${sizeName(ctx, body.px)}`,
    weightClass(b.fontWeight),
    "transition-colors focus-ring",
    "disabled:pointer-events-none aria-busy:pointer-events-none",
  ]);
  const sizes = {
    sm: `h-${unit(b.height.sm)} px-${unit(b.paddingX.sm)}`,
    md: `h-${unit(b.height.md)} px-${unit(b.paddingX.md)}`,
    lg: `h-${unit(b.height.lg)} px-${unit(b.paddingX.lg)}`,
  };

  const tailwindCode = ctx.shadcn
    ? [
        "// components/ui/button.tsx: replace the cva definition",
        `const buttonVariants = cva("${base}", {`,
        "  variants: {",
        "    variant: {",
        ...VARIANTS.map((v) => `      ${v}: "${buttonVariantClasses(ctx, v)}",`),
        "    },",
        "    size: {",
        ...Object.entries(sizes).map(([k, v]) => `      ${k}: "${v}",`),
        "    },",
        "  },",
        '  defaultVariants: { variant: "primary", size: "md" },',
        "});",
      ]
    : [
        `const base = "${base}";`,
        "const variants = {",
        ...VARIANTS.map((v) => `  ${v}: "${buttonVariantClasses(ctx, v)}",`),
        "};",
        "const sizes = {",
        ...Object.entries(sizes).map(([k, v]) => `  ${k}: "${v}",`),
        "};",
        "// className = `${base} ${variants[variant]} ${sizes[size]}`",
      ];

  const hoverTransition = ctx.t.signature.hover.css.transition;
  const cssCode = lines(
    ".btn {",
    "  display: inline-flex; align-items: center; justify-content: center;",
    `  gap: var(--space-${String(spacing.semantic.inlineGap / spacing.base).replace(".", "_")});`,
    "  height: var(--control-h); padding: 0 var(--button-px);",
    `  border: ${controls.buttons.borderWidth}px solid transparent; border-radius: var(--radius-md);`,
    `  font: ${b.fontWeight} var(--text-base)/1 var(--font-body); cursor: pointer;`,
    hoverTransition ? `  transition: ${hoverTransition};` : null,
    "}",
    `.btn--sm { height: var(--control-h-sm); padding: 0 ${b.paddingX.sm}px; }`,
    `.btn--lg { height: var(--control-h-lg); padding: 0 ${b.paddingX.lg}px; }`,
    VARIANTS.flatMap((variant) => {
      const states = controls.buttons.variants[variant];
      const decl = (style: ControlStateStyle, base?: ControlStateStyle) =>
        [
          !base || style.background !== base.background ? `background: ${ctx.cssVar(style.background, "fill", HINTS[variant].bg)};` : "",
          !base || style.color !== base.color ? `color: ${ctx.cssVar(style.color, "text", HINTS[variant].text)};` : "",
          !base || style.borderColor !== base.borderColor ? `border-color: ${ctx.cssVar(style.borderColor, "border", HINTS[variant].border)};` : "",
        ]
          .filter(Boolean)
          .join(" ");
      return [
        `.btn--${variant} { ${decl(states.default)} }`,
        `.btn--${variant}:hover { ${decl(states.hover, states.default)} }`,
        `.btn--${variant}:active { ${decl(states.pressed, states.default)} }`,
        `.btn--${variant}:disabled { ${decl(states.disabled, states.default)} cursor: not-allowed; }`,
      ];
    }),
    '.btn[aria-busy="true"] { pointer-events: none; }',
  );

  const cell = (variant: ButtonVariant, state: ButtonState): string => {
    if (state === "focus") return "same colors, plus `focus-ring`";
    if (state === "loading") return "same colors, spinner, `aria-busy`";
    const style = ctx.t.controls.buttons.variants[variant][state];
    if (!ctx.tailwind) {
      return `bg ${ctx.colorName(style.background) ?? "transparent"}, text ${ctx.colorName(style.color)}${style.borderColor !== "transparent" ? `, border ${ctx.colorName(style.borderColor)}` : ""}`;
    }
    const base = state === "default" ? undefined : ctx.t.controls.buttons.variants[variant].default;
    const classes = paintClasses(ctx, style, PREFIX[state], base, HINTS[variant]).map((c) => `\`${c}\``);
    return classes.length ? classes.join(" ") : "same as default";
  };

  const spinner = controls.buttons.spinner;
  return lines(
    "### Buttons",
    "",
    "Four variants, six states. Height " + `${b.height.md}px by default (sm ${b.height.sm}, lg ${b.height.lg}), radius md, weight ${b.fontWeight}.`,
    "- **primary**: the one main action on a view.",
    "- **secondary**: supporting actions that sit next to the primary.",
    "- **tertiary**: low emphasis: cancel, back, inline actions.",
    "- **destructive**: only for actions that delete or cannot be undone. Confirm first.",
    "",
    fence(ctx.tailwind ? "tsx" : "css", ctx.tailwind ? tailwindCode : cssCode),
    "",
    ...table(["State", ...VARIANTS], STATES.map((state) => [state, ...VARIANTS.map((v) => cell(v, state))])),
    "",
    "Focus: same colors plus `focus-ring`. Loading: same colors, a spinner before the label, `aria-busy`, no clicks. Only disabled is faded, and it needs a reason shown nearby.",
    "",
    `Spinner: ${ctx.tailwind ? `\`<svg className="ds-spinner size-${unit(spinner.size)}" viewBox="0 0 16 16" fill="none">\`` : `an inline svg with class \`ds-spinner\``}, a ${spinner.strokeWidth}px ring (circle r=6, 25% arc), \`currentColor\`, before the label.`,
    "",
    fence("css", compactCss(spinner.stylesheet).split("\n")),
    "",
  );
}

// ─────────────────────────────────────────────────────────────
// Inputs
// ─────────────────────────────────────────────────────────────

function inputClasses(ctx: SkillContext): string {
  const { inputs } = ctx.t.controls;
  const s = inputs.states;
  const classes = [
    `h-${unit(inputs.height)} w-full rounded-md border`,
    ctx.twColor("border", s.default.borderColor),
    ctx.twColor("bg", s.default.background, ["background"]),
    `px-${unit(inputs.paddingX)} py-${unit(inputs.paddingY)}`,
    "text-base",
    ctx.twColor("text", s.default.color),
    ctx.twColor("placeholder:text", inputs.placeholderColor),
    ctx.twColor("hover:border", s.hover.borderColor),
    ctx.twColor("focus-visible:border", s.focus.borderColor),
    "focus-ring",
    ctx.twColor("aria-invalid:border", s.error.borderColor),
    "disabled:cursor-not-allowed",
    ctx.twColor("disabled:border", s.disabled.borderColor),
    ctx.twColor("disabled:bg", s.disabled.background, ["muted"]),
    ctx.twColor("disabled:text", s.disabled.color),
  ];
  return join(classes);
}

function inputsSection(ctx: SkillContext): string[] {
  const { inputs } = ctx.t.controls;
  const s = inputs.states;
  const states: InputState[] = ["default", "hover", "focus", "error", "disabled"];
  const cssCode = lines(
    ".input {",
    `  height: var(--control-h); width: 100%; padding: var(--input-py) var(--input-px);`,
    `  border: ${inputs.borderWidth}px solid ${ctx.cssVar(s.default.borderColor, "border")}; border-radius: var(--radius-md);`,
    `  background: ${ctx.cssVar(s.default.background, "fill")}; color: ${ctx.cssVar(s.default.color, "text")}; font: inherit;`,
    "}",
    `.input::placeholder { color: ${ctx.cssVar(inputs.placeholderColor, "text")}; opacity: 1; }`,
    `.input:hover { border-color: ${ctx.cssVar(s.hover.borderColor, "border")}; }`,
    `.input:focus-visible { border-color: ${ctx.cssVar(s.focus.borderColor, "border")}; }`,
    `.input[aria-invalid="true"] { border-color: ${ctx.cssVar(s.error.borderColor, "border")}; }`,
    `.input:disabled { border-color: ${ctx.cssVar(s.disabled.borderColor, "border")}; background: ${ctx.cssVar(s.disabled.background, "fill")}; color: ${ctx.cssVar(s.disabled.color, "text")}; cursor: not-allowed; }`,
  );
  return lines(
    "### Inputs",
    "",
    `Height ${inputs.height}px, radius md, text ${ctx.t.typography.sizes.find((x) => x.name === "base")!.px}px. The outline is the \`input\` border, never the decorative \`border\`. Placeholder text is not a label: every input has a visible label.`,
    "",
    fence(ctx.tailwind ? "tsx" : "css", ctx.tailwind ? [`<input className="${inputClasses(ctx)}" />`] : cssCode),
    "",
    ...table(["State", "Border", "Background"], states.map((state) => [state + (({ focus: " (plus the focus ring)", error: " (plus error text)" } as Record<string, string>)[state] ?? ""), ctx.colorName(s[state].borderColor, "border") ?? "", ctx.colorName(s[state].background, "fill") ?? ""])),
    "",
  );
}

// ─────────────────────────────────────────────────────────────
// Radio, checkbox, switch
// ─────────────────────────────────────────────────────────────

function selectionSection(ctx: SkillContext): string[] {
  const { selection, selectionRules } = ctx.t.controls;
  const { spacing } = ctx.t;
  const on = ctx.shadcn ? "data-[state=checked]:" : "checked:";
  const states = (control: SelectionControl) => selection.states[control];
  const box = (control: SelectionControl) => {
    const st = states(control);
    return join([
      `peer size-${unit(selection.size)} shrink-0 border`,
      control === "checkbox" ? "rounded-sm" : "rounded-full",
      ctx.twColor("border", st.default.borderColor),
      ctx.twColor("bg", st.default.background, ["background"]),
      ctx.twColor("hover:border", st.hover.borderColor),
      ctx.twColor(`${on}border`, st.checked.borderColor),
      ctx.twColor(`${on}bg`, st.checked.background),
      "focus-ring",
      ctx.twColor("aria-invalid:border", st.error.borderColor),
      ctx.twColor("disabled:border", st.disabled.borderColor),
      ctx.twColor("disabled:bg", st.disabled.background, ["muted"]),
      ctx.shadcn ? "" : "appearance-none",
    ]);
  };
  const sw = states("switch");
  const { width, height, thumb } = selection.switch;
  const pad = (height - 2 * selection.borderWidth - thumb) / 2;
  const travel = width - 2 * selection.borderWidth - 2 * pad - thumb;
  const track = join([
    `relative inline-flex h-${unit(height)} w-${unit(width)} shrink-0 items-center rounded-full border p-${unit(pad)}`,
    ctx.twColor("border", sw.default.borderColor),
    ctx.twColor("bg", sw.default.background, ["background"]),
    ctx.twColor(`${on}border`, sw.checked.borderColor),
    ctx.twColor(`${on}bg`, sw.checked.background),
    "focus-ring",
    ctx.twColor("disabled:border", sw.disabled.borderColor),
    ctx.twColor("disabled:bg", sw.disabled.background, ["muted"]),
  ]);
  const thumbClasses = join([`pointer-events-none block size-${unit(thumb)} rounded-full transition-transform`, ctx.twColor("bg", sw.default.markColor), ctx.twColor(`${on}bg`, sw.checked.markColor, ["primary-foreground"]), `${on}translate-x-${unit(travel)}`]);

  const rule = (control: SelectionControl) => selectionRules.find((r) => r.control === control)!;
  const cssCode = lines(
    ".check, .radio { appearance: none; margin: 0; flex-shrink: 0;",
    `  width: ${selection.size}px; height: ${selection.size}px; border: ${selection.borderWidth}px solid ${ctx.cssVar(states("checkbox").default.borderColor, "border")};`,
    `  background: ${ctx.cssVar(states("checkbox").default.background, "fill")}; }`,
    `.check { border-radius: var(--radius-sm); } .radio { border-radius: var(--radius-full); }`,
    `.check:hover, .radio:hover { border-color: ${ctx.cssVar(states("checkbox").hover.borderColor, "border")}; }`,
    `.check:checked, .radio:checked { border-color: ${ctx.cssVar(states("checkbox").checked.borderColor, "border")}; background: ${ctx.cssVar(states("checkbox").checked.background, "fill")}; }`,
    `.check:disabled, .radio:disabled { border-color: ${ctx.cssVar(states("checkbox").disabled.borderColor, "border")}; background: ${ctx.cssVar(states("checkbox").disabled.background, "fill")}; }`,
    `.check[aria-invalid="true"], .radio[aria-invalid="true"] { border-color: ${ctx.cssVar(states("checkbox").error.borderColor, "border")}; }`,
    "/* Switch: a button with role=switch and aria-checked. The thumb is a child span. */",
    `.switch { position: relative; width: ${width}px; height: ${height}px; padding: ${pad}px; border: ${selection.borderWidth}px solid ${ctx.cssVar(sw.default.borderColor, "border")}; border-radius: var(--radius-full); background: ${ctx.cssVar(sw.default.background, "fill")}; }`,
    `.switch[aria-checked="true"] { border-color: ${ctx.cssVar(sw.checked.borderColor, "border")}; background: ${ctx.cssVar(sw.checked.background, "fill")}; }`,
    `.switch__thumb { display: block; width: ${thumb}px; height: ${thumb}px; border-radius: var(--radius-full); background: ${ctx.cssVar(sw.default.markColor, "fill")}; transition: transform 150ms; }`,
    `.switch[aria-checked="true"] .switch__thumb { background: ${ctx.cssVar(sw.checked.markColor, "fill")}; transform: translateX(${travel}px); }`,
    ".check:focus-visible, .radio:focus-visible, .switch:focus-visible { /* apply the same rules as .focus-ring */ }",
  );

  const tailwindCode = [
    `// Checkbox${ctx.shadcn ? " (shadcn Checkbox: pass as className)" : ""}`,
    `"${box("checkbox")}"`,
    "// Radio: the checkbox classes with rounded-sm replaced by rounded-full. Checked shows a small dot in primary-foreground.",
    `// Switch track, then thumb (role="switch")`,
    `"${track}"`,
    `"${thumbClasses}"`,
  ];

  return lines(
    "### Radio, checkbox and switch",
    "",
    `Box ${selection.size}px, ${selection.borderWidth}px outline in the \`input\` border. Checked is the primary color. Focus uses the focus ring. Error is the destructive border plus text. Disabled is muted. Switch track ${width} by ${height}px.`,
    "",
    fence(ctx.tailwind ? "tsx" : "css", ctx.tailwind ? tailwindCode : cssCode),
    "",
    ...table(["Control", "Use when", "Avoid when"], (["radio", "checkbox", "switch"] as SelectionControl[]).map((c) => [c, rule(c).useWhen, rule(c).avoidWhen])),
    "",
    `Always put a visible label to the right of the control, with a ${ctx.tailwind ? `\`gap-${unit(spacing.semantic.inlineGap)}\`` : "gap from the spacing ladder"}. The whole label is clickable.`,
    "",
  );
}

// ─────────────────────────────────────────────────────────────
// Select
// ─────────────────────────────────────────────────────────────

function selectSection(ctx: SkillContext): string[] {
  const { colors, spacing } = ctx.t;
  return lines(
    "### Select",
    "",
    `Use a select for 6 or more options, or when space is tight. Fewer than 6 and one choice: radios. The trigger is styled exactly like an input${ctx.shadcn ? " (pass the input classes to `SelectTrigger`)" : ""}. The menu is a floating layer:`,
    "",
    fence(ctx.tailwind ? "tsx" : "css", ctx.tailwind
      ? [`menu: "${join(["rounded-md border", ctx.twColor("border", colors.roles.border), ctx.twColor("bg", colors.roles.popover, ["popover"]), ctx.twColor("text", colors.roles["popover-foreground"], ["popover-foreground"]), shadowClass(3), `p-${unit(spacing.semantic.inlineGap / 2)}`])}"`, `item: "${join(["rounded-sm px-" + unit(spacing.semantic.inputPaddingX), "py-" + unit(spacing.semantic.inputPaddingY / 2), "focus-ring", ctx.twColor("hover:bg", colors.roles.accent, ["accent"]), ctx.twColor("hover:text", colors.roles["accent-foreground"], ["accent-foreground"])])}"`]
      : [`.menu { border: 1px solid ${ctx.cssVar(colors.roles.border, "border")}; border-radius: var(--radius-md); background: ${ctx.cssVar(colors.roles.popover, "fill")}; color: ${ctx.cssVar(colors.roles["popover-foreground"], "text")}; box-shadow: var(--shadow-3); }`, `.menu__item:hover { background: ${ctx.cssVar(colors.roles.accent, "fill")}; color: ${ctx.cssVar(colors.roles["accent-foreground"], "text")}; }`]),
    "",
  );
}

// ─────────────────────────────────────────────────────────────
// Tables
// ─────────────────────────────────────────────────────────────

function tablesSection(ctx: SkillContext): string[] {
  const { colors, typography } = ctx.t;
  const lineHeight = typography.sizes.find((size) => size.name === "base")!.lineHeightPx;
  const rowFor = (density: (typeof DENSITIES)[number]) => spacingFor(ctx, density).inputPaddingY * 2 + lineHeight;
  const current = rowFor(ctx.s.spacing.density);
  const head = join(["text-sm font-medium", ctx.twColor("text", colors.roles["muted-foreground"]), ctx.twColor("bg", colors.roles.muted, ["muted"])]);
  const cell = join(["text-base", ctx.twColor("text", colors.roles.foreground), ctx.twColor("border-t border", colors.roles.border, ["border"])]);
  const num = `text-right ${typography.tabularNumbers.className}`;

  return lines(
    "### Tables",
    "",
    "Header: small, medium weight, muted text on the muted fill. Cells: base size, foreground text, a hairline between rows. No zebra stripes, no vertical lines. Numbers are right aligned with tabular numbers, and so is their header. Text is left aligned. Put the primary column first.",
    "",
    fence(ctx.tailwind ? "tsx" : "css", ctx.tailwind
      ? [`<table className="w-full">`, `  <th scope="col" className="${head} text-left h-${unit(current)} px-${unit(ctx.t.spacing.semantic.inputPaddingX)}">Name</th>`, `  <th scope="col" className="${head} text-right h-${unit(current)} px-${unit(ctx.t.spacing.semantic.inputPaddingX)}">Amount</th>`, `  <td className="${cell} h-${unit(current)} px-${unit(ctx.t.spacing.semantic.inputPaddingX)}">Acme</td>`, `  <td className="${cell} ${num} px-${unit(ctx.t.spacing.semantic.inputPaddingX)}">11,111.00</td>`, `  // row hover: "${join([ctx.twColor("hover:bg", colors.roles.accent, ["accent"])])}"`, "</table>"]
      : [`.table th { text-align: left; font-size: var(--text-sm); font-weight: ${ctx.t.controls.buttons.fontWeight}; color: ${ctx.cssVar(colors.roles["muted-foreground"], "text")}; background: ${ctx.cssVar(colors.roles.muted, "fill", ["muted"])}; height: ${current}px; padding: 0 var(--input-px); }`, `.table td { height: ${current}px; padding: 0 var(--input-px); border-top: 1px solid ${ctx.cssVar(colors.roles.border, "border")}; }`, `.table .num { text-align: right; font-variant-numeric: tabular-nums; }`, `.table tbody tr:hover { background: ${ctx.cssVar(colors.roles.accent, "fill")}; }`]),
    "",
    `Row height follows density (cell padding plus a ${lineHeight}px line): ${DENSITIES.map((d) => `${d} ${rowFor(d)}px${ctx.tailwind ? ` \`h-${unit(rowFor(d))}\`` : ""}${d === ctx.s.spacing.density ? " (this design)" : ""}`).join(", ")}.`,
    "",
    "Long text truncates with an ellipsis and shows the full value in a title. A table with no rows shows an empty state, never a bare header.",
    "",
  );
}

// ─────────────────────────────────────────────────────────────
// Cards, forms, dashboards, charts, pricing
// ─────────────────────────────────────────────────────────────

function cardsSection(ctx: SkillContext): string[] {
  const { typography, spacing, icons } = ctx.t;
  const title = typography.sizes.find((s) => s.name === "lg")!;
  return lines(
    "### Cards",
    "",
    `A card is the \`card\` class (see Signature details). Padding ${spacing.semantic.cardPadding}px, gap ${spacing.semantic.stackGap}px between its parts. Title: ${title.px}px, heading font, weight ${typography.headingWeight}. Body text is muted. One primary action per card, at the bottom.`,
    "",
    fence(ctx.tailwind ? "tsx" : "html", ctx.tailwind
      ? [`<div className="card card-hover flex flex-col gap-${unit(spacing.semantic.stackGap)}">`, `  <span className="icon-tile"><Icon className="size-${unit(icons.sizes.md)}" /></span>`, `  <h3 className="font-heading text-${title.name} ${weightClass(typography.headingWeight)} tracking-heading-xs">Title</h3>`, `  <p className="text-sm ${ctx.twColor("text", ctx.t.colors.roles["muted-foreground"])}">Supporting text.</p>`, "</div>"]
      : [`<div class="card card-hover"><span class="icon-tile">…</span><h3>Title</h3><p>Supporting text.</p></div>`]),
    "",
  );
}

function formsSection(ctx: SkillContext): string[] {
  const { spacing, colors } = ctx.t;
  const err = statusText(ctx, "error");
  const gap = unit(spacing.semantic.inlineGap / 2);
  return lines(
    "### Forms",
    "",
    `Labels sit above fields, ${spacing.semantic.inlineGap / 2}px apart. Fields are ${spacing.semantic.stackGap}px apart. Helper text is small and muted, below the field. Error text replaces the helper text, is small, uses \`${err}\`, and says what to fix. Mark errors with the destructive border and \`aria-invalid\`, never with color alone. One column, full width. The primary button comes last.`,
    "",
    fence(ctx.tailwind ? "tsx" : "html", ctx.tailwind
      ? [`<form className="flex flex-col gap-${unit(spacing.semantic.stackGap)}">`, `  <div className="flex flex-col gap-${gap}">`, `    <label className="text-sm ${weightClass(ctx.t.controls.buttons.fontWeight)}" htmlFor="email">Email</label>`, `    <input id="email" className="${inputClasses(ctx)}" aria-describedby="email-help" />`, `    <p id="email-help" className="text-sm ${ctx.twColor("text", colors.roles["muted-foreground"])}">We only use it to sign you in.</p>`, "  </div>", "</form>"]
      : [`<div class="field"><label for="email">Email</label><input id="email" class="input" aria-describedby="email-help"><p id="email-help" class="field__help">We only use it to sign you in.</p></div>`]),
    "",
  );
}

function dashboardsSection(ctx: SkillContext): string[] {
  const { spacing, typography, colors } = ctx.t;
  const big = typography.sizes.find((s) => s.name === "3xl")!;
  return lines(
    "### Dashboards",
    "",
    `Page padding and section gaps use ${spacing.semantic.sectionGap}px. Cards sit in a grid with ${spacing.semantic.stackGap}px gaps. A metric card has a small muted label, a big number (${big.px}px, heading font, tabular numbers) and one optional change indicator. Positive change uses \`${statusText(ctx, "success")}\`, negative uses \`${statusText(ctx, "error")}\`, and always includes an arrow or sign so color is never the only signal. Metrics come first, then charts, then the table. One primary action per dashboard.`,
    "",
    fence(ctx.tailwind ? "tsx" : "html", ctx.tailwind
      ? [`<div className="grid gap-${unit(spacing.semantic.stackGap)} sm:grid-cols-2 lg:grid-cols-4">`, `  <div className="card">`, `    <p className="text-sm ${ctx.twColor("text", colors.roles["muted-foreground"])}">Revenue</p>`, `    <p className="font-heading text-${big.name} ${weightClass(typography.headingWeight)} tracking-heading ${typography.tabularNumbers.className}">11,111</p>`, `    <p className="text-sm ${statusText(ctx, "success")} ${typography.tabularNumbers.className}">+12.4%</p>`, "  </div>", "</div>"]
      : [`<div class="stats"><div class="card"><p class="stat__label">Revenue</p><p class="stat__value">11,111</p></div></div>`]),
    "",
  );
}

function chartsSection(ctx: SkillContext): string[] {
  const { colors } = ctx.t;
  return lines(
    "### Charts",
    "",
    `Series colors, in this order: ${[1, 2, 3, 4, 5].map((n) => `${ctx.tailwind ? `\`fill-chart-${n}\`` : `\`var(--chart-${n})\``}`).join(", ")}${ctx.tailwind ? " (and \`stroke-chart-N\`)" : ""}. Never reorder them or add a sixth. They differ in hue and lightness, so they stay apart for color blind users, and each reaches 3:1 on the background (lowest ${Math.min(...[1, 2, 3, 4, 5].map((n) => contrastRatio(colors.roles[`chart-${n}` as "chart-1"], colors.roles.background))).toFixed(2)}:1).`,
    "",
    `- One series: chart 1. Two to five: in order. More than five: group the rest as "Other" in ${ctx.tailwind ? "`fill-neutral-400`" : "`var(--neutral-400)`"}.`,
    `- Axis and legend text: ${ctx.tailwind ? "`text-xs fill-muted-foreground`" : "`var(--text-xs)`, `var(--muted-foreground)`"}. Grid lines: ${ctx.tailwind ? "`stroke-border`" : "`var(--border)`"}, horizontal only. No chart borders, no 3D, no gradients.`,
    "- Label lines and bars directly where there is room. Never rely on color alone: add a marker shape, a pattern or a direct label.",
    `- Tooltips are floating layers: ${ctx.tailwind ? "`bg-popover text-popover-foreground border border-border rounded-md shadow-md`" : "popover colors, border, radius md, shadow level 3"}. Numbers use tabular figures.`,
    "- Every chart has a text title, a unit, and a table or text summary for screen readers.",
    "",
  );
}

function pricingSection(ctx: SkillContext): string[] {
  const { spacing, typography } = ctx.t;
  const samples = Object.fromEntries(buildVoiceSamples(ctx.s.voice).map((s) => [s.id, s]));
  const big = typography.sizes.find((s) => s.name === "4xl")!;
  return lines(
    "### Pricing cards",
    "",
    `Plans sit in a grid with ${spacing.semantic.stackGap}px gaps, centered headings, equal height. The recommended plan is the only one with \`card-featured\` and the only one with the primary button and \`cta\`. The others use \`card card-hover\` and secondary buttons. Price: ${big.px}px, heading font, tabular numbers. Under the CTA, one short line that removes doubt. Copy: \`${samples.pricing.main}\` then \`${samples.pricing.extra}\`. Write only what is true for the product.`,
    "",
    ctx.tailwind
      ? `Grid: \`grid gap-${unit(spacing.semantic.stackGap)} md:grid-cols-3\`. Featured plan: \`card card-featured\` with \`<Button variant="primary" className="cta">${samples.pricing.main}</Button>\`. Other plans: \`card card-hover\` with a secondary button.`
      : `Grid: \`.plans\`. Featured plan: \`card card-featured\` with \`<button class="btn btn--primary cta">${samples.pricing.main}</button>\`. Other plans: \`card card-hover\` with a secondary button.`,
    "",
  );
}

export function componentsSection(ctx: SkillContext): string[] {
  const empty = sampleText(buildVoiceSamples(ctx.s.voice).find((s) => s.id === "empty")!);
  return lines(
    "## 2. Components",
    "",
    ctx.shadcn ? "Use shadcn components as the base and pass these classes. Do not restyle a component any other way." : ctx.tailwind ? "Write plain React components with these classes." : "Use these classes. Add a modifier class for a variant, never inline styles.",
    "",
    buttonsSection(ctx),
    inputsSection(ctx),
    selectionSection(ctx),
    selectSection(ctx),
    tablesSection(ctx),
    cardsSection(ctx),
    formsSection(ctx),
    dashboardsSection(ctx),
    chartsSection(ctx),
    pricingSection(ctx),
    `Empty states for any list, table or chart use one sentence of copy, such as "${empty}", and one action.`,
    "",
  );
}

// Re-exported for the data and rule sections.
export { statusText };
export type { SelectionState };
