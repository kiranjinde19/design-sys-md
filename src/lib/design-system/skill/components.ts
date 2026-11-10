import { contrastRatio } from "../contrast";
import type { ButtonState, ButtonVariant, ControlStateStyle, InputState, SelectionControl } from "../types";
import {
  DENSITIES,
  compactCss,
  fence,
  lines,
  paintClasses,
  sizeName,
  spacingFor,
  unit,
  weightClass,
  type PaintHints,
  type SkillContext,
} from "./context";

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "tertiary", "destructive"];
const PREFIX: Partial<Record<ButtonState, string>> = { hover: "hover", pressed: "active", disabled: "disabled" };
const join = (parts: string[]) => parts.filter(Boolean).join(" ");

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
  for (const state of ["hover", "pressed", "disabled"] as ButtonState[]) classes.push(...paintClasses(ctx, states[state], PREFIX[state], states.default, HINTS[variant]));
  return join(classes);
}

function buttonsSection(ctx: SkillContext): string[] {
  const { controls, spacing, typography } = ctx.t;
  const b = controls.buttons;
  const body = typography.sizes.find((size) => size.name === "base")!;
  const base = join(["inline-flex items-center justify-center", `gap-${unit(spacing.semantic.inlineGap)}`, "rounded-md border border-transparent", `text-${sizeName(ctx, body.px)}`, weightClass(b.fontWeight), "transition-colors focus-ring disabled:pointer-events-none aria-busy:pointer-events-none"]);
  const sizes = { sm: `h-${unit(b.height.sm)} px-${unit(b.paddingX.sm)}`, md: `h-${unit(b.height.md)} px-${unit(b.paddingX.md)}`, lg: `h-${unit(b.height.lg)} px-${unit(b.paddingX.lg)}` };
  const sizeNote = `Heights ${b.height.sm}, ${b.height.md} (default) and ${b.height.lg}px, radius md, weight ${b.fontWeight}.`;

  const tw = ctx.shadcn
    ? [`// components/ui/button.tsx: replace the cva definition`, `const buttonVariants = cva("${base}", {`, "  variants: {", "    variant: {", ...VARIANTS.map((v) => `      ${v}: "${buttonVariantClasses(ctx, v)}",`), "    },", `    size: { ${Object.entries(sizes).map(([k, v]) => `${k}: "${v}"`).join(", ")} },`, "  },", '  defaultVariants: { variant: "primary", size: "md" },', "});"]
    : [`const base = "${base}";`, "const variants = {", ...VARIANTS.map((v) => `  ${v}: "${buttonVariantClasses(ctx, v)}",`), "};", `const sizes = { ${Object.entries(sizes).map(([k, v]) => `${k}: "${v}"`).join(", ")} };`];

  const hoverTransition = ctx.t.signature.hover.css.transition;
  const css = lines(
    ".btn {",
    "  display: inline-flex; align-items: center; justify-content: center;",
    `  gap: var(--space-${String(spacing.semantic.inlineGap / spacing.base).replace(".", "_")}); height: var(--control-h); padding: 0 var(--button-px);`,
    `  border: ${b.borderWidth}px solid transparent; border-radius: var(--radius-md); font: ${b.fontWeight} var(--text-base)/1 var(--font-body); cursor: pointer;`,
    hoverTransition ? `  transition: ${hoverTransition};` : null,
    "}",
    `.btn--sm { height: var(--control-h-sm); padding: 0 ${b.paddingX.sm}px; } .btn--lg { height: var(--control-h-lg); padding: 0 ${b.paddingX.lg}px; }`,
    VARIANTS.flatMap((variant) => {
      const st = b.variants[variant];
      const decl = (style: ControlStateStyle, base?: ControlStateStyle) =>
        [
          !base || style.background !== base.background ? `background: ${ctx.cssVar(style.background, "fill", HINTS[variant].bg)};` : "",
          !base || style.color !== base.color ? `color: ${ctx.cssVar(style.color, "text", HINTS[variant].text)};` : "",
          !base || style.borderColor !== base.borderColor ? `border-color: ${ctx.cssVar(style.borderColor, "border", HINTS[variant].border)};` : "",
        ].filter(Boolean).join(" ");
      return [`.btn--${variant} { ${decl(st.default)} } .btn--${variant}:hover { ${decl(st.hover, st.default)} } .btn--${variant}:active { ${decl(st.pressed, st.default)} } .btn--${variant}:disabled { ${decl(st.disabled, st.default)} cursor: not-allowed; }`];
    }),
    '.btn[aria-busy="true"] { pointer-events: none; }',
  );

  const spinner = b.spinner;
  return lines(
    "### Buttons",
    "",
    `**primary** the one main action; **secondary** supporting actions; **tertiary** low emphasis such as cancel; **destructive** only for deleting or irreversible actions, with a confirmation. ${sizeNote}`,
    "",
    fence(ctx.tailwind ? "tsx" : "css", ctx.tailwind ? tw : css),
    "",
    `Focus: same colors plus \`focus-ring\`. Loading: same colors, a ${spinner.size}px spinner (${ctx.tailwind ? `\`ds-spinner size-${unit(spinner.size)}\`` : "`ds-spinner`"}, a ${spinner.strokeWidth}px ring, \`currentColor\`) before the label, \`aria-busy\`, no clicks. Only disabled is faded, and it needs a reason shown nearby.`,
    "",
    fence("css", compactCss(spinner.stylesheet).split("\n")),
    "",
  );
}

function inputClasses(ctx: SkillContext): string {
  const { inputs } = ctx.t.controls;
  const s = inputs.states;
  return join([
    `h-${unit(inputs.height)} w-full rounded-md border`,
    ctx.twColor("border", s.default.borderColor),
    ctx.twColor("bg", s.default.background, ["background"]),
    `px-${unit(inputs.paddingX)} py-${unit(inputs.paddingY)} text-base`,
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
  ]);
}

export const inputClassString = inputClasses;

function inputsSection(ctx: SkillContext): string[] {
  const { inputs } = ctx.t.controls;
  const s = inputs.states;
  const states: InputState[] = ["default", "hover", "focus", "error", "disabled"];
  const popover = ctx.t.colors.roles;
  const cssCode = lines(
    ".input { height: var(--control-h); width: 100%; padding: var(--input-py) var(--input-px); font: inherit;",
    `  border: ${inputs.borderWidth}px solid ${ctx.cssVar(s.default.borderColor, "border")}; border-radius: var(--radius-md); background: ${ctx.cssVar(s.default.background, "fill", ["background"])}; color: ${ctx.cssVar(s.default.color, "text")}; }`,
    `.input::placeholder { color: ${ctx.cssVar(inputs.placeholderColor)}; opacity: 1; } .input:hover { border-color: ${ctx.cssVar(s.hover.borderColor, "border")}; }`,
    `.input:focus-visible { border-color: ${ctx.cssVar(s.focus.borderColor, "border")}; } .input[aria-invalid="true"] { border-color: ${ctx.cssVar(s.error.borderColor, "border")}; }`,
    `.input:disabled { border-color: ${ctx.cssVar(s.disabled.borderColor, "border")}; background: ${ctx.cssVar(s.disabled.background, "fill", ["muted"])}; color: ${ctx.cssVar(s.disabled.color, "text")}; cursor: not-allowed; }`,
    `.menu { border: 1px solid ${ctx.cssVar(popover.border, "border")}; border-radius: var(--radius-md); background: ${ctx.cssVar(popover.popover, "fill", ["popover"])}; color: ${ctx.cssVar(popover["popover-foreground"], "text")}; box-shadow: var(--shadow-3); } .menu__item:hover { background: ${ctx.cssVar(popover.accent, "fill", ["accent"])}; color: ${ctx.cssVar(popover["accent-foreground"], "text", ["accent-foreground"])}; }`,
  );
  return lines(
    "### Inputs and selects",
    "",
    `Height ${inputs.height}px, radius md. The outline is the \`input\` border. Every input has a visible label, and placeholder text is never the label. States: ${states.map((state) => `${state} (${ctx.colorName(s[state].borderColor, "border")} border${state === "focus" ? ", plus the focus ring" : state === "error" ? ", plus error text" : ""})`).join(", ")}. A select (6 or more options, or tight space) uses the same classes on its trigger; fewer options and one choice, use radios.`,
    "",
    fence(ctx.tailwind ? "tsx" : "css", ctx.tailwind ? [`<input className="${inputClasses(ctx)}" />`, `menu: "${join(["rounded-md border", ctx.twColor("border", popover.border, ["border"]), ctx.twColor("bg", popover.popover, ["popover"]), ctx.twColor("text", popover["popover-foreground"], ["popover-foreground"]), "shadow-md"])}"; item hover: "${join([ctx.twColor("hover:bg", popover.accent, ["accent"]), ctx.twColor("hover:text", popover["accent-foreground"], ["accent-foreground"])])}"`] : cssCode),
    "",
  );
}

function selectionSection(ctx: SkillContext): string[] {
  const { selection, selectionRules } = ctx.t.controls;
  const on = ctx.shadcn ? "data-[state=checked]:" : "checked:";
  const states = (control: SelectionControl) => selection.states[control];
  const st = states("checkbox");
  const box = join([
    `peer size-${unit(selection.size)} shrink-0 border rounded-sm`,
    ctx.twColor("border", st.default.borderColor),
    ctx.twColor("bg", st.default.background, ["background"]),
    ctx.twColor("hover:border", st.hover.borderColor),
    ctx.twColor(`${on}border`, st.checked.borderColor),
    ctx.twColor(`${on}bg`, st.checked.background),
    ctx.shadcn ? "" : "appearance-none",
  ]);
  const stateClasses = join(["focus-ring", ctx.twColor("aria-invalid:border", st.error.borderColor), ctx.twColor("disabled:border", st.disabled.borderColor), ctx.twColor("disabled:bg", st.disabled.background, ["muted"])]);
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
  ]);
  const thumbClasses = join([`pointer-events-none block size-${unit(thumb)} rounded-full transition-transform`, ctx.twColor("bg", sw.default.markColor), ctx.twColor(`${on}bg`, sw.checked.markColor, ["primary-foreground"]), `${on}translate-x-${unit(travel)}`]);
  const cssCode = lines(
    `.check, .radio { appearance: none; margin: 0; flex-shrink: 0; width: ${selection.size}px; height: ${selection.size}px; border: ${selection.borderWidth}px solid ${ctx.cssVar(st.default.borderColor, "border")}; background: ${ctx.cssVar(st.default.background, "fill", ["background"])}; }`,
    `.check { border-radius: var(--radius-sm); } .radio { border-radius: var(--radius-full); } .check:hover, .radio:hover { border-color: ${ctx.cssVar(st.hover.borderColor, "border")}; }`,
    `.check:checked, .radio:checked { border-color: ${ctx.cssVar(st.checked.borderColor, "border")}; background: ${ctx.cssVar(st.checked.background, "fill")}; }`,
    `.check:disabled, .radio:disabled { border-color: ${ctx.cssVar(st.disabled.borderColor, "border")}; background: ${ctx.cssVar(st.disabled.background, "fill", ["muted"])}; }`,
    `.switch { position: relative; width: ${width}px; height: ${height}px; padding: ${pad}px; border: ${selection.borderWidth}px solid ${ctx.cssVar(sw.default.borderColor, "border")}; border-radius: var(--radius-full); background: ${ctx.cssVar(sw.default.background, "fill", ["background"])}; }`,
    `.switch[aria-checked="true"] { border-color: ${ctx.cssVar(sw.checked.borderColor, "border")}; background: ${ctx.cssVar(sw.checked.background, "fill")}; }`,
    `.switch__thumb { display: block; width: ${thumb}px; height: ${thumb}px; border-radius: var(--radius-full); background: ${ctx.cssVar(sw.default.markColor, "fill")}; transition: transform 150ms; }`,
    `.switch[aria-checked="true"] .switch__thumb { background: ${ctx.cssVar(sw.checked.markColor, "fill", ["primary-foreground"])}; transform: translateX(${travel}px); }`,
  );
  const rule = (control: SelectionControl) => selectionRules.find((r) => r.control === control)!;
  return lines(
    "### Radio, checkbox, switch",
    "",
    ...(["radio", "checkbox", "switch"] as SelectionControl[]).map((c) => `- **${c}:** use when ${rule(c).useWhen.replace(/\.$/, "").replace(/^./, (m) => m.toLowerCase())}. Avoid: ${rule(c).avoidWhen.replace(/\.$/, "").replace(/^./, (m) => m.toLowerCase())}.`),
    "",
    `Box ${selection.size}px with the \`input\` border. Checked is primary, focus uses the focus ring, error is the destructive border plus text, disabled is muted. Label to the right, whole label clickable.`,
    "",
    fence(ctx.tailwind ? "tsx" : "css", ctx.tailwind ? [`// Checkbox${ctx.shadcn ? " (shadcn Checkbox className)" : ""}. Radio: rounded-full, and a dot in primary-foreground when checked.`, `"${box}"`, `// Switch track and thumb (role="switch")`, `"${track}"`, `"${thumbClasses}"`, `// Add to all three: "${stateClasses}"`] : cssCode),
    "",
  );
}

function tablesSection(ctx: SkillContext): string[] {
  const { colors, typography, spacing } = ctx.t;
  const lineHeight = typography.sizes.find((size) => size.name === "base")!.lineHeightPx;
  const rowFor = (density: (typeof DENSITIES)[number]) => spacingFor(ctx, density).inputPaddingY * 2 + lineHeight;
  const current = rowFor(ctx.s.spacing.density);
  const px = `px-${unit(spacing.semantic.inputPaddingX)}`;
  const head = join(["h-" + unit(current), px, "text-sm font-medium", ctx.twColor("text", colors.roles["muted-foreground"]), ctx.twColor("bg", colors.roles.muted, ["muted"])]);
  const cell = join(["h-" + unit(current), px, "text-base", ctx.twColor("text", colors.roles.foreground), ctx.twColor("border-t border", colors.roles.border, ["border"])]);
  return lines(
    "### Tables",
    "",
    `Header: small, medium weight, muted text on the muted fill. Cells: base size, a hairline between rows, no zebra stripes or vertical lines. Numbers right aligned with tabular figures, header included; text left aligned. Row height follows density: ${DENSITIES.map((d) => `${d} ${rowFor(d)}px${ctx.tailwind ? ` (\`h-${unit(rowFor(d))}\`)` : ""}${d === ctx.s.spacing.density ? " (this design)" : ""}`).join(", ")}. Truncate long text with an ellipsis and a title. An empty table shows an empty state, not a bare header.`,
    "",
    fence(ctx.tailwind ? "tsx" : "html", ctx.tailwind
      ? ["<table className=\"w-full\">", "  <thead><tr>", `    <th scope="col" className="${head} text-left">Name</th>`, `    <th scope="col" className="${head} text-right">Amount</th>`, "  </tr></thead>", "  <tbody><tr className=\"" + ctx.twColor("hover:bg", colors.roles.accent, ["accent"]) + "\">", `    <td className="${cell}">Acme</td>`, `    <td className="${cell} text-right ${typography.tabularNumbers.className}">11,111.00</td>`, "  </tr></tbody>", "</table>"]
      : ["<table class=\"table\">", "  <thead><tr><th scope=\"col\">Name</th><th scope=\"col\" class=\"num\">Amount</th></tr></thead>", "  <tbody><tr><td>Acme</td><td class=\"num\">11,111.00</td></tr></tbody>", "</table>", `<style>.table th { text-align: left; font-size: var(--text-sm); color: ${ctx.cssVar(colors.roles["muted-foreground"], "text")}; background: ${ctx.cssVar(colors.roles.muted, "fill", ["muted"])}; height: ${current}px; padding: 0 var(--input-px); } .table td { height: ${current}px; padding: 0 var(--input-px); border-top: 1px solid ${ctx.cssVar(colors.roles.border, "border", ["border"])}; } .table .num { text-align: right; font-variant-numeric: tabular-nums; } .table tbody tr:hover { background: ${ctx.cssVar(colors.roles.accent, "fill", ["accent"])}; }</style>`]),
    "",
  );
}

export function componentsSection(ctx: SkillContext, rest: string[][]): string[] {
  return lines(
    "## Components",
    "",
    ctx.shadcn ? "Use shadcn components as the base and pass these classes. Do not restyle a component any other way." : ctx.tailwind ? "Plain React components with these classes." : "Use these classes. Add a modifier class for a variant, never inline styles.",
    "",
    buttonsSection(ctx),
    inputsSection(ctx),
    selectionSection(ctx),
    tablesSection(ctx),
    ...rest,
  );
}

// Used by the data and accessibility templates.
export function statusTextClass(ctx: SkillContext, name: "success" | "warning" | "error" | "info"): string {
  const { colors } = ctx.t;
  const surfaces = [colors.roles.background, colors.roles.card, colors.roles.muted];
  const step = ([700, 800, 600] as const).find((st) => surfaces.every((surface) => contrastRatio(colors.semantic[name][st], surface) >= 4.5)) ?? 800;
  return `text-${name}-${step}`;
}
