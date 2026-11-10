/**
 * Typography generator: fonts, weights, tracking, base size and ratio in; a full type
 * ladder and complete CSS font stacks out.
 */

import { FONT_CATALOG, SYSTEM_STACKS, effectiveFont, getFont, isDisplayFont, nearestWeight } from "./fonts";
import { bodyFontWarnings } from "./font-pairings";
import type {
  FontChoice,
  FontRole,
  FontToken,
  TypeSizeName,
  TypeSizeToken,
  TypographySettings,
  TypographyTokens,
} from "./types";
import { round } from "./units";

// Kept for older imports. The list now lives in fonts.ts.
export { FONT_CATALOG };

/** Turns one font choice into a font token with its full CSS stacks. */
export function resolveFont(choice: FontChoice, role: FontRole): FontToken {
  const font = effectiveFont(choice);
  const system = SYSTEM_STACKS[font.category];

  if (choice.kind === "brand") {
    return {
      role,
      name: choice.name,
      source: "brand",
      licensed: true,
      category: font.category,
      // The brand font comes first. The fallback follows, so text still looks right if the brand font is missing.
      stack: `"${choice.name}", "${font.name}", ${system}`,
      // This tool cannot ship a licensed font, so previews use the fallback.
      previewStack: `"${font.name}", ${system}`,
      fallbackName: font.name,
      offeredWeights: font.weights,
    };
  }

  const stack = `"${font.name}", ${system}`;
  return {
    role,
    name: font.name,
    source: "catalog",
    licensed: false,
    category: font.category,
    stack,
    previewStack: stack,
    fallbackName: null,
    offeredWeights: font.weights,
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

/**
 * Body text is never tracked. Headings use the chosen tracking at full strength from
 * 3xl up, and a smaller share on the way down, since small headings need less tightening.
 */
function letterSpacingFor(step: number, tracking: number): string {
  const share = step >= 4 ? 1 : step === 3 ? 0.5 : step === 2 ? 0.25 : 0;
  const value = round(tracking * share, 3);
  return `${value === 0 ? 0 : value}em`;
}

/** No size on the ladder goes below this, so small print stays readable. */
export const MIN_FONT_SIZE = 12;

export function generateTypography(settings: TypographySettings): TypographyTokens {
  const heading = resolveFont(settings.headingFont, "heading");
  const body = resolveFont(settings.bodyFont, "body");
  const mono = settings.monoFont ? resolveFont(settings.monoFont, "mono") : null;

  const sizes: TypeSizeToken[] = SIZE_LADDER.map(({ name, step }) => {
    // Whole pixels only. rem is worked out from the rounded px so the two always agree.
    const pxValue = Math.max(MIN_FONT_SIZE, Math.round(settings.baseSize * settings.scaleRatio ** step));
    return {
      name,
      step,
      px: pxValue,
      rem: round(pxValue / 16, 4),
      lineHeight: lineHeightFor(step, settings.lineHeight),
      letterSpacing: letterSpacingFor(step, settings.headingTracking),
    };
  });

  // Component recipes use regular, medium, semibold and bold. Each maps to the nearest
  // weight the body font really offers, so a recipe never asks for a missing weight.
  const offered = body.offeredWeights;
  const weights = {
    regular: nearestWeight(400, offered),
    medium: nearestWeight(500, offered),
    semibold: nearestWeight(600, offered),
    bold: nearestWeight(700, offered),
  };

  return {
    heading,
    body,
    mono,
    stacks: {
      heading: heading.stack,
      body: body.stack,
      mono: mono ? mono.stack : SYSTEM_STACKS.mono,
    },
    headingTracking: settings.headingTracking,
    tabularNumbers: {
      css: { fontVariantNumeric: "tabular-nums" },
      className: "tabular-nums",
      usage: "Use for tables, dashboards, prices and any column of numbers, so digits line up and values do not jitter when they change.",
    },
    warnings: bodyFontWarnings(settings.bodyFont),
    baseSize: settings.baseSize,
    scaleRatio: settings.scaleRatio,
    bodyLineHeight: settings.lineHeight,
    weights,
    headingWeight: nearestWeight(settings.headingWeight, heading.offeredWeights),
    bodyWeight: nearestWeight(settings.bodyWeight, body.offeredWeights),
    sizes,
  };
}

export { getFont, isDisplayFont };
