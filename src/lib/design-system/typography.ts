/** Typography generator: base size + ratio in, a full type ladder out. */

import type {
  TypeSizeName,
  TypeSizeToken,
  TypographySettings,
  TypographyTokens,
  FontToken,
} from "./types";
import { round } from "./units";

interface FontEntry {
  name: string;
  category: "sans" | "serif" | "mono";
  fallback: string;
  /** CSS variable holding the font if this app has loaded it with next/font. */
  appVariable?: string;
}

const SANS_FALLBACK = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const SERIF_FALLBACK = "ui-serif, Georgia, 'Times New Roman', serif";

/**
 * The curated font list. Only Inter is loaded in this app today, so only
 * Inter will render truthfully in the preview. Loading the rest comes with
 * the font picker.
 */
export const FONT_CATALOG: FontEntry[] = [
  { name: "Inter", category: "sans", fallback: SANS_FALLBACK, appVariable: "--font-inter" },
  { name: "DM Sans", category: "sans", fallback: SANS_FALLBACK },
  { name: "Manrope", category: "sans", fallback: SANS_FALLBACK },
  { name: "Plus Jakarta Sans", category: "sans", fallback: SANS_FALLBACK },
  { name: "Space Grotesk", category: "sans", fallback: SANS_FALLBACK },
  { name: "IBM Plex Sans", category: "sans", fallback: SANS_FALLBACK },
  { name: "Source Serif 4", category: "serif", fallback: SERIF_FALLBACK },
  { name: "Playfair Display", category: "serif", fallback: SERIF_FALLBACK },
];

export function resolveFont(name: string): FontToken {
  const entry = FONT_CATALOG.find((font) => font.name === name);
  const fallback = entry?.fallback ?? SANS_FALLBACK;
  const stack = `"${name}", ${fallback}`;
  return {
    name,
    stack,
    previewStack: entry?.appVariable ? `var(${entry.appVariable}), ${fallback}` : stack,
  };
}

/** Where each named size sits relative to the base size. */
const SIZE_LADDER: { name: TypeSizeName; step: number }[] = [
  { name: "xs", step: -2 },
  { name: "sm", step: -1 },
  { name: "base", step: 0 },
  { name: "lg", step: 1 },
  { name: "xl", step: 2 },
  { name: "2xl", step: 3 },
  { name: "3xl", step: 4 },
  { name: "4xl", step: 5 },
  { name: "5xl", step: 6 },
];

/** Small text keeps the body line height. Bigger text gets tighter, down to a floor of 1.1. */
function lineHeightFor(step: number, bodyLineHeight: number): number {
  if (step <= 0) return round(bodyLineHeight, 2);
  return round(Math.max(1.1, bodyLineHeight - 0.08 * step), 2);
}

/** Big headings look loose at default spacing, so they are pulled in slightly. */
function letterSpacingFor(step: number): string {
  if (step >= 4) return "-0.02em";
  if (step === 3) return "-0.01em";
  return "0em";
}

export function generateTypography(settings: TypographySettings): TypographyTokens {
  const sizes: TypeSizeToken[] = SIZE_LADDER.map(({ name, step }) => {
    const pxValue = settings.baseSize * settings.scaleRatio ** step;
    return {
      name,
      step,
      px: round(pxValue, 2),
      rem: round(pxValue / 16, 4),
      lineHeight: lineHeightFor(step, settings.lineHeight),
      letterSpacing: letterSpacingFor(step),
    };
  });

  return {
    heading: resolveFont(settings.headingFont),
    body: resolveFont(settings.bodyFont),
    baseSize: settings.baseSize,
    scaleRatio: settings.scaleRatio,
    bodyLineHeight: settings.lineHeight,
    weights: { regular: 400, medium: 500, semibold: 600, bold: 700 },
    headingWeight: settings.headingWeight,
    bodyWeight: settings.bodyWeight,
    sizes,
  };
}
