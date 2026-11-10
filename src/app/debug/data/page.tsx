import type { Metadata } from "next";
import { generateTokens } from "@/lib/design-system/generate";
import { PRESETS } from "@/lib/design-system/presets";
import { radiusLabel } from "@/lib/design-system/radius";
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
    title: "Type scale",
    body: [
      `Heading: ${tokens.typography.heading.name} ${tokens.typography.headingWeight}, body: ${tokens.typography.body.name} ${tokens.typography.bodyWeight}`,
      `Base ${tokens.typography.baseSize}px, ratio ${tokens.typography.scaleRatio}, body line height ${tokens.typography.bodyLineHeight}`,
      "",
      `${pad("name", 6)}${pad("px", 9)}${pad("rem", 10)}${pad("line height", 13)}letter spacing`,
      ...tokens.typography.sizes.map(
        (size) =>
          `${pad(size.name, 6)}${pad(size.px, 9)}${pad(size.rem, 10)}${pad(size.lineHeight, 13)}${size.letterSpacing}`,
      ),
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
