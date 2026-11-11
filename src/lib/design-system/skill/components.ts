import { contrastRatio } from "../contrast";
import type { ButtonState, ButtonVariant, ControlStateStyle, InputState, SelectionControl } from "../types";
import {
  DENSITIES,
  compactCss,
  fence,
  lines,
  paintClasses,
  sizeName,
  spaceVar,
  spacingFor,
  unit,
  weightClass,
  type PaintHints,
  type SkillContext, tight } from "./context";

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
    : [
        "// src/components/Button.tsx",
        "export const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(\" \");",
        "",
        `const base = "${base}";`,
        "const variants = {",
        ...VARIANTS.map((v) => `  ${v}: "${buttonVariantClasses(ctx, v)}",`),
        "};",
        `const sizes = { ${Object.entries(sizes).map(([k, v]) => `${k}: "${v}"`).join(", ")} };`,
        "",
        "type Props = React.ComponentProps<\"button\"> & { variant?: keyof typeof variants; size?: keyof typeof sizes; loading?: boolean };",
        "",
        'export function Button({ variant = "primary", size = "md", loading = false, className, children, disabled, type = "button", ...props }: Props) {',
        "  return (",
        "    <button type={type} className={cx(base, variants[variant], sizes[size], className)} aria-busy={loading || undefined} disabled={disabled || loading} {...props}>",
        `      {loading && <span className="ds-spinner size-${unit(b.spinner.size)} rounded-full border-${b.spinner.strokeWidth} border-current border-t-transparent" aria-hidden="true" />}`,
        "      {children}",
        "    </button>",
        "  );",
        "}",
      ];

  const hoverTransition = ctx.t.signature.hover.css.transition;
  const css = lines(
    ".btn {",
    "  display: inline-flex; align-items: center; justify-content: center;",
    "  gap: var(--gap-inline); height: var(--control-h); padding: 0 var(--button-px);",
    `  border: var(--border-w) solid transparent; border-radius: var(--radius-md); font: ${b.fontWeight} var(--text-base)/1 var(--font-body); cursor: pointer;`,
    hoverTransition ? `  transition: ${hoverTransition};` : null,
    "}",
    `.btn--sm { height: var(--control-h-sm); padding: 0 ${spaceVar(ctx, b.paddingX.sm)}; } .btn--lg { height: var(--control-h-lg); padding: 0 ${spaceVar(ctx, b.paddingX.lg)}; }`,
    VARIANTS.flatMap((variant) => {
      const st = b.variants[variant];
      const decl = (style: ControlStateStyle, base?: ControlStateStyle) =>
        [
          !base || style.background !== base.background ? `background: ${ctx.cssVar(style.background, "fill", HINTS[variant].bg)};` : "",
          !base || style.color !== base.color ? `color: ${ctx.cssVar(style.color, "text", HINTS[variant].text)};` : "",
          (base ? style.borderColor !== base.borderColor : style.borderColor !== "transparent") ? `border-color: ${ctx.cssVar(style.borderColor, "border", HINTS[variant].border)};` : "",
        ].filter(Boolean).join(" ");
      return [`.btn--${variant} { ${decl(st.default)} } .btn--${variant}:hover { ${decl(st.hover, st.default)} } .btn--${variant}:active { ${decl(st.pressed, st.default)} } .btn--${variant}:disabled { ${decl(st.disabled, st.default)} }`];
    }),
    '.btn:disabled { cursor: not-allowed; } .btn[aria-busy="true"] { pointer-events: none; }',
  );

  const spinner = b.spinner;
  return lines(
    "### Buttons",
    "",
    `**primary** the one main action; **secondary** supporting actions; **tertiary** low emphasis such as cancel; **destructive** only for deleting or irreversible actions, with a confirmation. ${sizeNote}`,
    "",
    fence(ctx.tailwind ? "tsx" : "css", ctx.tailwind ? tw : tight(ctx, css)),
    "",
    `Focus: same colors plus ${ctx.tailwind ? "`focus-ring`" : "the automatic focus ring"}. Loading: same colors, a ${spinner.size}px spinner (${ctx.tailwind ? `\`ds-spinner size-${unit(spinner.size)}\`` : "`ds-spinner`"}, a ${spinner.strokeWidth}px ring, \`currentColor\`) before the label, \`aria-busy\`, no clicks. Only disabled is faded, and it needs a reason shown nearby.`,
    "",
    fence("css", tight(ctx, compactCss(spinner.stylesheet).split("\n"))),
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
  const spacing = { inlineGap: ctx.t.spacing.semantic.inlineGap };
  const cssCode = lines(
    ".input { height: var(--control-h); width: 100%; padding: var(--input-py) var(--input-px); font: inherit;",
    `  border: var(--border-w) solid ${ctx.cssVar(s.default.borderColor, "border")}; border-radius: var(--radius-md); background: ${ctx.cssVar(s.default.background, "fill", ["background"])}; color: ${ctx.cssVar(s.default.color, "text")}; }`,
    `.input::placeholder { color: ${ctx.cssVar(inputs.placeholderColor)}; opacity: 1; } .input:hover { border-color: ${ctx.cssVar(s.hover.borderColor, "border")}; }`,
    `.input:focus-visible { border-color: ${ctx.cssVar(s.focus.borderColor, "border")}; } .input[aria-invalid="true"] { border-color: ${ctx.cssVar(s.error.borderColor, "border")}; }`,
    `.input:disabled { border-color: ${ctx.cssVar(s.disabled.borderColor, "border")}; background: ${ctx.cssVar(s.disabled.background, "fill", ["muted"])}; color: ${ctx.cssVar(s.disabled.color, "text")}; cursor: not-allowed; }`,
    `.menu { border: var(--border-w) solid ${ctx.cssVar(popover.border, "border")}; border-radius: var(--radius-md); background: ${ctx.cssVar(popover.popover, "fill", ["popover"])}; color: ${ctx.cssVar(popover["popover-foreground"], "text")}; box-shadow: var(--shadow-3); padding: ${spaceVar(ctx, spacing.inlineGap / 2)}; } .menu__item { display: block; padding: ${spaceVar(ctx, ctx.t.spacing.semantic.inputPaddingY / 2)} var(--input-px); border-radius: var(--radius-sm); cursor: pointer; } .menu__item:hover { background: ${ctx.cssVar(popover.accent, "fill", ["accent"])}; color: ${ctx.cssVar(popover["accent-foreground"], "text", ["accent-foreground"])}; }`,
  );
  return lines(
    "### Inputs and selects",
    "",
    `Height ${inputs.height}px, radius md. The outline is the \`input\` border. Every input has a visible label, and placeholder text is never the label. States: ${states.map((state) => `${state} (${ctx.colorName(s[state].borderColor, "border")} border${state === "focus" ? ", plus the focus ring" : state === "error" ? ", plus error text" : ""})`).join(", ")}. A select (6 or more options, or tight space) uses the same classes on its trigger; fewer options and one choice, use radios.`,
    "",
    fence(ctx.tailwind ? "tsx" : "css", ctx.tailwind ? [`<input className="${inputClasses(ctx)}" />`, `menu: "${join(["rounded-md border", ctx.twColor("border", popover.border, ["border"]), ctx.twColor("bg", popover.popover, ["popover"]), ctx.twColor("text", popover["popover-foreground"], ["popover-foreground"]), "shadow-md"])}"; item hover: "${join([ctx.twColor("hover:bg", popover.accent, ["accent"]), ctx.twColor("hover:text", popover["accent-foreground"], ["accent-foreground"])])}"`] : tight(ctx, cssCode)),
    "",
  );
}

function selectionSection(ctx: SkillContext): string[] {
  const { selection, selectionRules } = ctx.t.controls;
  const react = !ctx.shadcn && ctx.tailwind;
  // shadcn marks state with data-state. Plain React marks checkboxes with :checked and the switch with aria-checked.
  const on = ctx.shadcn ? "data-[state=checked]:" : "checked:";
  const swOn = ctx.shadcn ? "data-[state=checked]:" : "aria-checked:";
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
    react ? "group" : "",
    `relative inline-flex h-${unit(height)} w-${unit(width)} shrink-0 items-center rounded-full border p-${unit(pad)}`,
    ctx.twColor("border", sw.default.borderColor),
    ctx.twColor("bg", sw.default.background, ["background"]),
    ctx.twColor(`${swOn}border`, sw.checked.borderColor),
    ctx.twColor(`${swOn}bg`, sw.checked.background),
  ]);
  const thumbOn = react ? "group-aria-checked:" : on;
  const thumbClasses = join([`pointer-events-none block size-${unit(thumb)} rounded-full transition-transform`, ctx.twColor("bg", sw.default.markColor), ctx.twColor(`${thumbOn}bg`, sw.checked.markColor, ["primary-foreground"]), `${thumbOn}translate-x-${unit(travel)}`]);

  // Plain CSS: every size is a variable, and the switch has its disabled and error states.
  const cv = ctx.cssVar;
  const cssCode = lines(
    `.check, .radio { appearance: none; margin: 0; flex-shrink: 0; width: var(--check-size); height: var(--check-size); }`,
    `.check, .radio, .switch { border: var(--border-w) solid ${cv(st.default.borderColor, "border")}; background: ${cv(st.default.background, "fill", ["background"])}; }`,
    `.check { border-radius: var(--radius-sm); } .radio { border-radius: var(--radius-full); } .check:hover, .radio:hover { border-color: ${cv(st.hover.borderColor, "border")}; }`,
    `.check:checked, .radio:checked, .switch[aria-checked="true"] { border-color: ${cv(st.checked.borderColor, "border")}; background: ${cv(st.checked.background, "fill")}; }`,
    `.check:disabled, .radio:disabled, .switch:disabled { border-color: ${cv(st.disabled.borderColor, "border")}; background: ${cv(st.disabled.background, "fill", ["muted"])}; cursor: not-allowed; }`,
    `.check[aria-invalid="true"], .radio[aria-invalid="true"], .switch[aria-invalid="true"] { border-color: ${cv(st.error.borderColor, "border")}; }`,
    `.switch { position: relative; width: var(--switch-w); height: var(--switch-h); padding: var(--switch-pad); border-radius: var(--radius-full); }`,
    `.switch__thumb { display: block; width: var(--switch-thumb); height: var(--switch-thumb); border-radius: var(--radius-full); background: ${cv(sw.default.markColor, "fill")}; transition: transform 150ms; }`,
    `.switch[aria-checked="true"] .switch__thumb { background: ${cv(sw.checked.markColor, "fill", ["primary-foreground"])}; transform: translateX(var(--switch-travel)); } .switch:disabled .switch__thumb { background: ${cv(sw.disabled.markColor, "fill")}; } .switch[aria-invalid="true"] .switch__thumb { background: ${cv(sw.error.markColor, "fill")}; }`,
  );

  // Plain React: complete components. A checkbox and a radio that really show a check mark and a dot.
  const markSize = unit(selection.size - 4);
  const dotSize = unit(Math.round(selection.size / 2.5 / 2) * 2);
  const reactCode = [
    "// src/components/Check.tsx",
    'import { Check } from "lucide-react";',
    'import { cx } from "./Button";',
    "",
    `const box = "${join([box.replace(" rounded-sm", ""), stateClasses])}";`,
    "type Props = React.ComponentProps<\"input\">;",
    "",
    "const Choice = ({ type, className, ...props }: Props) => (",
    `  <span className="relative inline-flex size-${unit(selection.size)} shrink-0">`,
    '    <input type={type} className={cx(box, type === "radio" ? "rounded-full" : "rounded-sm", className)} {...props} />',
    '    {type === "radio" ? (',
    `      <span aria-hidden className="pointer-events-none absolute inset-0 m-auto size-${dotSize} rounded-full ${ctx.twColor("bg", st.checked.markColor, ["primary-foreground"])} opacity-0 peer-checked:opacity-100" />`,
    "    ) : (",
    `      <Check aria-hidden strokeWidth={${ctx.t.icons.strokeWidth * 2}} className="pointer-events-none absolute inset-0 m-auto size-${markSize} ${ctx.twColor("text", st.checked.markColor, ["primary-foreground"])} opacity-0 peer-checked:opacity-100" />`,
    "    )}",
    "  </span>",
    ");",
    'export const Checkbox = (props: Props) => <Choice type="checkbox" {...props} />;',
    'export const Radio = (props: Props) => <Choice type="radio" {...props} />;',
    "",
    '// Switch: <button role="switch" aria-checked={on} onClick={() => setOn(!on)} className={cx(track, stateClasses)}><span className={thumb} /></button>',
    `const track = "${track}";`,
    `const thumb = "${thumbClasses}";`,
    `const stateClasses = "${stateClasses}";`,
  ];

  const rule = (control: SelectionControl) => selectionRules.find((r) => r.control === control)!;
  return lines(
    "### Radio, checkbox, switch",
    "",
    ...(ctx.shadcn ? (["radio", "checkbox", "switch"] as SelectionControl[]).map((c) => `- **${c}:** use when ${rule(c).useWhen.replace(/\.$/, "").replace(/^./, (m) => m.toLowerCase())}. Avoid: ${rule(c).avoidWhen.replace(/\.$/, "").replace(/^./, (m) => m.toLowerCase())}.`) : [(["radio", "checkbox", "switch"] as SelectionControl[]).map((c) => `**${c}** when ${rule(c).useWhen.replace(/\.$/, "").replace(/^./, (m) => m.toLowerCase())} (not ${rule(c).avoidWhen.replace(/\.$/, "").replace(/^./, (m) => m.toLowerCase())})`).join("; ") + "."]),
    "",
    `Box ${selection.size}px with the \`input\` border. Checked is primary, focus uses the focus ring, error is the destructive border plus text, disabled is muted. Label to the right, whole label clickable.`,
    "",
    fence(ctx.tailwind ? "tsx" : "css", react ? reactCode : ctx.tailwind ? [`// Checkbox${ctx.shadcn ? " (shadcn Checkbox className)" : ""}. Radio: rounded-full, and a dot in primary-foreground when checked.`, `"${box}"`, `// Switch track and thumb (role="switch")`, `"${track}"`, `"${thumbClasses}"`, `// Add to all three: "${stateClasses}"`] : tight(ctx, cssCode)),
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
    `Header: small, medium weight, muted text on the muted fill. Cells: base size, a hairline between rows, no zebra stripes or vertical lines. Numbers right aligned with tabular figures, header included; text left aligned. Row height follows density: ${DENSITIES.map((d) => `${d} ${rowFor(d)}px${ctx.tailwind ? ` (\`h-${unit(rowFor(d))}\`)` : ""}${d === ctx.s.spacing.density ? " (this design)" : ""}`).join(", ")}. Truncate long text with an ellipsis and a title.`,
    "",
    fence(ctx.tailwind ? "tsx" : "html", ctx.tailwind
      ? [`const th = "${head}"; // + text-left or text-right`, `const td = "${cell}"; // + text-left or text-right (numbers: ${typography.tabularNumbers.className})`, "<table className=\"w-full\">", "  <thead><tr><th scope=\"col\" className={`${th} text-left`}>Name</th><th scope=\"col\" className={`${th} text-right`}>Amount</th></tr></thead>", "  <tbody><tr className=\"" + ctx.twColor("hover:bg", colors.roles.accent, ["accent"]) + "\"><td className={`${td} text-left`}>Acme</td><td className={`${td} text-right " + typography.tabularNumbers.className + "`}>11,111.00</td></tr></tbody>", "</table>"]
      : ["<table class=\"table\">", "  <thead><tr><th scope=\"col\">Name</th><th scope=\"col\" class=\"num\">Amount</th></tr></thead>", "  <tbody><tr><td>Acme</td><td class=\"num\">11,111.00</td></tr></tbody>", "</table>"]),
    ctx.tailwind ? null : "",
    ctx.tailwind ? null : fence("css", tight(ctx, [`.table { width: 100%; border-collapse: collapse; } .table th { height: var(--row-h); padding: 0 var(--input-px); text-align: left; font-size: var(--text-sm); font-weight: ${ctx.t.controls.buttons.fontWeight}; color: ${ctx.cssVar(colors.roles["muted-foreground"], "text")}; background: ${ctx.cssVar(colors.roles.muted, "fill", ["muted"])}; }`, `.table td { height: var(--row-h); padding: 0 var(--input-px); border-top: var(--border-w) solid ${ctx.cssVar(colors.roles.border, "border", ["border"])}; } .table .num { text-align: right; font-variant-numeric: tabular-nums; } .table tbody tr:hover { background: ${ctx.cssVar(colors.roles.accent, "fill", ["accent"])}; }`])),
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

/** A status text color: a Tailwind class, or the CSS variable in plain CSS. Never a Tailwind name in plain CSS. */
export function statusRef(ctx: SkillContext, name: "success" | "warning" | "error" | "info"): string {
  const cls = statusTextClass(ctx, name);
  return ctx.tailwind ? cls : `var(--${cls.slice("text-".length)})`;
}

// Used by the data and accessibility templates.
export function statusTextClass(ctx: SkillContext, name: "success" | "warning" | "error" | "info"): string {
  const { colors } = ctx.t;
  const surfaces = [colors.roles.background, colors.roles.card, colors.roles.muted];
  const step = ([700, 800, 600] as const).find((st) => surfaces.every((surface) => contrastRatio(colors.semantic[name][st], surface) >= 4.5)) ?? 800;
  return `text-${name}-${step}`;
}
