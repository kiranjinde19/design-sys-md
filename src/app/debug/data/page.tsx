import type { Metadata } from "next";
import { generateTokens } from "@/lib/design-system/generate";
import { PRESETS } from "@/lib/design-system/presets";
import { radiusLabel } from "@/lib/design-system/radius";
import { FONT_CATALOG, WEIGHT_LABELS, getFont } from "@/lib/design-system/fonts";
import { FONT_PAIRINGS, PAIRING_SAMPLE_LINE, pairingGalleryUrl, recommendBodyFonts } from "@/lib/design-system/font-pairings";
import { fontNamesUrl, selectedFontsUrl } from "@/lib/design-system/font-loading";
import { SIGNATURE_CATALOG } from "@/lib/design-system/signature";
import {
  SCALE_STEPS,
  SHADCN_ROLE_NAMES,
  type ColorScale,
  type ContrastLevels,
  type ScaleReport,
  type SignatureSettings,
} from "@/lib/design-system/types";

export const metadata: Metadata = {
  title: "Token data (temporary)",
  robots: { index: false },
};

const preset = PRESETS["saas-clean"];
const tokens = generateTokens(preset.settings);

const pad = (value: string | number, width: number) => String(value).padEnd(width);

const pf = (passes: boolean) => (passes ? "pass" : "FAIL");

/** "6.28:1  4.5 pass | 3 pass | 7 FAIL" */
function contrastCell(levels: ContrastLevels) {
  return `${levels.ratio.toFixed(2).padStart(5)}:1  4.5 ${pf(levels.normal)} | 3 ${pf(levels.large)} | 7 ${pf(levels.aaa)}`;
}

function guidanceText(report: ScaleReport) {
  const { whiteTextFrom, darkTextUpTo } = report.guidance;
  return [
    `Filled background with white text: ${whiteTextFrom ? `step ${whiteTextFrom} and darker` : "no step passes"}`,
    `Filled background with dark text:  ${darkTextUpTo ? `step ${darkTextUpTo} and lighter` : "no step passes"}`,
  ].join("\n");
}

function scaleText(scale: ColorScale, report: ScaleReport) {
  return [
    guidanceText(report),
    "",
    `${pad("step", 6)}${pad("hex", 9)}${pad("vs white", 40)}vs black`,
    ...SCALE_STEPS.map(
      (step) =>
        `${pad(step, 6)}${pad(scale[step], 9)}${pad(contrastCell(report.contrast[step].onWhite), 40)}${contrastCell(report.contrast[step].onBlack)}`,
    ),
  ].join("\n");
}


const stateCell = (style: { background: string; color: string; borderColor: string; opacity: number; spinner: boolean }) =>
  `bg ${style.background} text ${style.color} border ${style.borderColor}${style.spinner ? " +spinner" : ""}${style.opacity < 1 ? ` opacity ${style.opacity}` : ""}`;

const controls = tokens.controls;

const sections: { title: string; body: string }[] = [
  {
    title: "How to read the contrast columns",
    body: [
      "4.5  normal text (WCAG AA)",
      "3    large text and UI parts such as borders, icons and focus rings (WCAG AA large)",
      "7    enhanced contrast (WCAG AAA)",
      "Ratios are rounded down, so a near miss never shows as a pass.",
      "Dark text means the neutral 900 ink used by the system, not pure black.",
    ].join("\n"),
  },
  {
    title: "Preset",
    body: `${preset.name}: ${preset.description}`,
  },
  {
    title: "Brand scale (step 600 is the exact brand color)",
    body: `Brand color ${preset.settings.colors.brand}\n\n${scaleText(tokens.colors.brand, tokens.colors.reports.brand)}`,
  },
  {
    title: `Neutral scale (${preset.settings.colors.neutralTone} tone)`,
    body: scaleText(tokens.colors.neutral, tokens.colors.reports.neutral),
  },
  {
    title: "Color roles (shadcn/ui names, each maps to the CSS variable of the same name)",
    body: SHADCN_ROLE_NAMES.map((role) => `${pad(`--${role}`, 26)}${tokens.colors.roles[role]}`).join("\n"),
  },
  {
    title: "Role contrast checks",
    body: [
      "Text pairs need 4.5:1. Input outlines and focus rings are interface parts and need 3:1. Decorative borders and dividers are not checked.",
      "",
      ...tokens.colors.contrastPairs.map(
        (pair) =>
          `${pad(pair.label, 40)}${pad(`${pair.foreground} on ${pair.background}`, 24)}${contrastCell(pair.levels)}  => ${pair.passes ? "PASS" : "FAIL"} (needs ${pair.required}:1)`,
      ),
    ].join("\n"),
  },
  {
    title: "Semantic colors (full scales, with contrast)",
    body: (["success", "warning", "error", "info"] as const)
      .map((name) => `${name.toUpperCase()}\n${scaleText(tokens.colors.semantic[name], tokens.colors.reports.semantic[name])}`)
      .join("\n\n"),
  },
  {
    title: "Fonts in use (complete CSS stacks, with system fallbacks)",
    body: [tokens.typography.heading, tokens.typography.body, ...(tokens.typography.mono ? [tokens.typography.mono] : [])]
      .map((font) =>
        [
          `${font.role.toUpperCase()}  ${font.name}  [${font.source === "brand" ? "licensed brand font" : "Google font"}, ${font.category}]`,
          font.fallbackName ? `  fallback and preview font: ${font.fallbackName}` : null,
          `  stack: ${font.stack}`,
          `  offers: ${font.offeredWeights.join(", ")}`,
        ]
          .filter(Boolean)
          .join("\n"),
      )
      .concat(tokens.typography.mono ? [] : [`MONO  none chosen\n  stack: ${tokens.typography.stacks.mono}`])
      .join("\n\n"),
  },
  {
    title: "Weights, tracking and tabular numbers",
    body: [
      `Heading weight ${tokens.typography.headingWeight} (${WEIGHT_LABELS[tokens.typography.headingWeight]}), body weight ${tokens.typography.bodyWeight} (${WEIGHT_LABELS[tokens.typography.bodyWeight]})`,
      `Component weights: regular ${tokens.typography.weights.regular}, medium ${tokens.typography.weights.medium}, semibold ${tokens.typography.weights.semibold}, bold ${tokens.typography.weights.bold}`,
      `Heading tracking: ${tokens.typography.headingTracking}em (smaller headings get a proportional share, body text none)`,
      "",
      `Tabular numbers: ${Object.entries(tokens.typography.tabularNumbers.css).map(([k, v]) => `${k}: ${v}`).join("; ")}  (Tailwind class: ${tokens.typography.tabularNumbers.className})`,
      tokens.typography.tabularNumbers.usage,
      "",
      tokens.typography.warnings.length ? `Warnings:\n${tokens.typography.warnings.map((w) => `  - ${w}`).join("\n")}` : "Warnings: none",
    ].join("\n"),
  },
  {
    title: "Type scale",
    body: [
      `Base ${tokens.typography.baseSize}px, ratio ${tokens.typography.scaleRatio}, body line height ${tokens.typography.bodyLineHeight}.`,
      "Sizes are even whole pixels (12px minimum), and from 20px up they sit on the 4px grid.",
      "Line heights are multiples of 4px. Headings stay tighter than body text. Both px and ratio are stored.",
      "Tracking applies to 2xl and larger and fades to 0 below that (xl half, lg a quarter, base and smaller none).",
      "",
      `${pad("name", 6)}${pad("px", 6)}${pad("rem", 8)}${pad("line height px", 16)}${pad("line height ratio", 19)}tracking`,
      ...tokens.typography.sizes.map(
        (size) =>
          `${pad(size.name, 6)}${pad(size.px, 6)}${pad(size.rem, 8)}${pad(`${size.lineHeightPx}px`, 16)}${pad(size.lineHeight, 19)}${size.letterSpacing}`,
      ),
    ].join("\n"),
  },
  {
    title: `Curated font list (${FONT_CATALOG.length} Google fonts: category, weights each really offers, default heading tracking, tags)`,
    body: FONT_CATALOG.map(
      (font) => `${pad(font.name, 22)}${pad(font.category, 7)}${pad(font.weights.join(" "), 38)}${pad(`${font.tracking}em`, 10)}${font.tags.join(", ")}`,
    ).join("\n"),
  },
  {
    title: "Font pairings",
    body: FONT_PAIRINGS.map(
      (p) =>
        `${p.name}  (${p.mood})${p.id === "modern-saas" ? "  [default]" : ""}\n  ${p.heading} ${p.headingWeight} + ${p.body} ${p.bodyWeight}${p.mono ? ` + ${p.mono} mono accent` : ""}, tracking ${getFont(p.heading)?.tracking}em (the heading font\u2019s default)\n  ${p.reason}`,
    )
      .concat([`Sample line on every card: "${PAIRING_SAMPLE_LINE}"`])
      .join("\n\n"),
  },
  {
    title: "Body font recommendations (shown after a manual heading pick)",
    body: ["Fraunces", "Space Grotesk", "Inter", "Source Serif 4"]
      .map(
        (h) =>
          `${h} -> ${recommendBodyFonts(h)
            .map((r) => r.font.name)
            .join(", ")}`,
      )
      .join("\n"),
  },
  {
    title: "Font loading (all use display=swap, none loads the full list)",
    body: [
      "Selected fonts, in the weights they offer:",
      `  ${selectedFontsUrl(tokens.typography) ?? "(none)"}`,
      "",
      "Picker names: one request for the whole list, carrying only the letters the names need:",
      `  ${fontNamesUrl()}`,
      "",
      "Pairing cards: only the fonts the cards use, carrying only the sample text letters:",
      `  ${pairingGalleryUrl()}`,
    ].join("\n"),
  },
  {
    title: "Radius ladder",
    body: (Object.keys(tokens.radius) as (keyof typeof tokens.radius)[])
      .map((name) => `${pad(name, 6)}${radiusLabel(name, tokens.radius)}`)
      .join("\n"),
  },
  {
    title: `Spacing ladder (${tokens.spacing.base}px base, ${tokens.spacing.density} density)`,
    body: [
      ...tokens.spacing.scale.map((step) => `${pad(step.key, 6)}${step.px}px`),
      "",
      "Semantic values at this density:",
      ...(Object.keys(tokens.spacing.semantic) as (keyof typeof tokens.spacing.semantic)[]).map(
        (role) => `${pad(role, 18)}${tokens.spacing.semantic[role]}px`,
      ),
    ].join("\n"),
  },
  {
    title: `Shadow levels (${tokens.elevation.style}, intensity ${tokens.elevation.intensity})`,
    body: tokens.elevation.shadows.map((shadow) => `Level ${shadow.level}: ${shadow.css}`).join("\n"),
  },
  {
    title: "Borders",
    body: [
      `Width ${tokens.borders.width}px`,
      "",
      "Decorative (dividers and cards, no contrast requirement):",
      `  colorSubtle  ${tokens.borders.colorSubtle}`,
      `  color        ${tokens.borders.color}`,
      `  colorStrong  ${tokens.borders.colorStrong}`,
      "",
      "Form controls (inputs, checkboxes, radios, switches):",
      `  input        ${tokens.borders.input}   lightest neutral that reaches 3:1 on the background`,
      `               neutral 400 ${tokens.colors.neutral[400]} is too light, neutral 500 ${tokens.colors.neutral[500]} passes, so an in-between shade is generated`,
      `  placeholder  ${tokens.colors.placeholder}   lightest neutral that reaches 4.5:1 on the background`,
      "",
      ...tokens.colors.contrastPairs
        .filter((pair) => pair.id === "input-on-background" || pair.id === "placeholder-on-background")
        .map((pair) => `${pad(pair.label, 40)}${pad(`${pair.foreground} on ${pair.background}`, 24)}${contrastCell(pair.levels)}  => ${pair.passes ? "PASS" : "FAIL"} (needs ${pair.required}:1)`),
    ].join("\n"),
  },
  {
    title: "Control padding (comfortable density, split between buttons and inputs)",
    body: [
      `Buttons  horizontal ${controls.buttons.paddingX.md}px (sm ${controls.buttons.paddingX.sm}, lg ${controls.buttons.paddingX.lg}), vertical ${controls.buttons.paddingY}px, height ${controls.buttons.height.md}px`,
      `Inputs   horizontal ${controls.inputs.paddingX}px, vertical ${controls.inputs.paddingY}px, height ${controls.inputs.height}px`,
    ].join("\n"),
  },
  {
    title: `Button states (secondary is ${controls.secondaryStyle}, from the ${tokens.colors.secondary ? "secondary color" : "neutral"} scale)`,
    body: [
      "Focus = same colors as default plus the signature focus ring. Loading = full color plus a spinner. Only disabled is faded.",
      "",
      ...(Object.keys(controls.buttons.variants) as (keyof typeof controls.buttons.variants)[]).flatMap((variant) => [
        variant.toUpperCase(),
        ...(Object.keys(controls.buttons.variants[variant]) as (keyof (typeof controls.buttons.variants)["primary"])[]).map(
          (state) => `  ${pad(state, 10)}${stateCell(controls.buttons.variants[variant][state])}`,
        ),
        "",
      ]),
    ].join("\n"),
  },
  {
    title: "Focus ring (shown on focus for buttons, inputs, checkboxes, radios and switches)",
    body: Object.entries(controls.focusRing)
      .map(([property, value]) => `${property}: ${value}`)
      .join("\n"),
  },
  {
    title: "Loading spinner CSS",
    body: `Size ${controls.buttons.spinner.size}px, stroke ${controls.buttons.spinner.strokeWidth}px\n\n${controls.buttons.spinner.stylesheet}`,
  },
  {
    title: "Input states (focus adds the brand border and the focus ring)",
    body: [
      `Placeholder color ${controls.inputs.placeholderColor}`,
      "",
      ...(Object.keys(controls.inputs.states) as (keyof typeof controls.inputs.states)[]).map(
        (state) => `${pad(state, 10)}${stateCell(controls.inputs.states[state])}`,
      ),
    ].join("\n"),
  },
  {
    title: "Radio, checkbox and switch states (mark = check, dot, or switch thumb)",
    body: [
      `Checkbox and radio ${controls.selection.size}px, switch ${controls.selection.switch.width} x ${controls.selection.switch.height}px with a ${controls.selection.switch.thumb}px thumb, border ${controls.selection.borderWidth}px`,
      `Radius: checkbox ${controls.selection.radius.checkbox}px, radio ${controls.selection.radius.radio}px, switch ${controls.selection.radius.switch}px`,
      "",
      ...(Object.keys(controls.selection.states) as (keyof typeof controls.selection.states)[]).flatMap((control) => [
        control.toUpperCase(),
        ...(Object.keys(controls.selection.states[control]) as (keyof (typeof controls.selection.states)["checkbox"])[]).map((state) => {
          const st = controls.selection.states[control][state];
          return `  ${pad(state, 10)}bg ${st.background} border ${st.borderColor} mark ${st.markColor}${state === "focus" ? " +focus ring" : ""}`;
        }),
        "",
      ]),
    ].join("\n"),
  },
  {
    title: "Signature detail defaults",
    body: (Object.keys(SIGNATURE_CATALOG) as (keyof SignatureSettings)[])
      .map((key) => {
        const recipe = tokens.signature[key];
        const css = Object.entries(recipe.css)
          .map(([property, value]) => `    ${property}: ${value}`)
          .join("\n");
        return `${SIGNATURE_CATALOG[key].label}: ${recipe.label}\n${css || "    (no styles)"}`;
      })
      .join("\n\n"),
  },
  {
    title: "Primary CTA stylesheet (glow, keyframes and reduced-motion fallback)",
    body: tokens.signature.primaryCta.stylesheet ?? "The primary CTA is not animated in this preset.",
  },
];

export default function DebugDataPage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-6 py-10">
      <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
        This page is temporary. It prints the SaaS Clean preset as plain text for checking and will be removed before launch.
      </p>
      <p className="rounded-lg border border-border px-3 py-2 font-mono text-xs text-muted-foreground">
        Built from commit {process.env.NEXT_PUBLIC_BUILD_COMMIT} at {process.env.NEXT_PUBLIC_BUILD_TIME}. Every deploy rebuilds
        this page. It runs the same generateTokens() as /debug, on the SaaS Clean defaults. /debug shows your own autosaved edits, so the two can
        differ if you changed a slider.
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">SaaS Clean: generated values</h1>
      {sections.map((section) => (
        <section key={section.title} className="space-y-2">
          <h2 className="text-base font-semibold">{section.title}</h2>
          <pre className="overflow-x-auto rounded-lg border border-border p-4 font-mono text-xs leading-relaxed">
            {section.body}
          </pre>
        </section>
      ))}
    </main>
  );
}
