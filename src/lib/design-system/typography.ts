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

/** No size on the ladder goes below this, so small print stays readable. */
export const MIN_FONT_SIZE = 12;

/**
 * Sizes are whole, even pixels. From 20px up they also sit on the 4px grid, which keeps
 * big headings in step with the 4px line heights. At the default ratio of 1.2 this gives
 * 12, 14, 16, 20, 24, 28, 32, 40, 48.
 */
export function snapFontSize(px: number): number {
  const even = Math.round(px / 2) * 2;
  const snapped = even >= 20 ? Math.round(px / 4) * 4 : even;
  return Math.max(MIN_FONT_SIZE, snapped);
}

/** Nearest multiple of 4. A tie goes down, which keeps text a little tighter. */
const snapToFour = (px: number) => Math.ceil(px / 4 - 0.5) * 4;

/** The line height wanted for a size, before snapping: body text keeps the body ratio, bigger text gets tighter, down to 1.1. */
function wantedLineHeight(step: number, bodyLineHeight: number): number {
  if (step <= 0) return bodyLineHeight;
  return Math.max(1.1, bodyLineHeight - 0.08 * step);
}

/**
 * Line heights snap to multiples of 4px. Headings stay tighter than body text, and no
 * line height is ever smaller than its font size.
 */
function lineHeightPxFor(sizePx: number, step: number, bodyLineHeight: number): number {
  const floor = Math.ceil(sizePx / 4) * 4;
  let px = Math.max(floor, snapToFour(sizePx * wantedLineHeight(step, bodyLineHeight)));
  if (step > 0) {
    while (px / sizePx > bodyLineHeight && px - 4 >= floor) px -= 4;
  }
  return px;
}

/**
 * Body text is never tracked. Headings use the chosen tracking at full strength from 2xl
 * up, then fade out below that: half at xl, a quarter at lg, none at base and smaller.
 */
function letterSpacingFor(step: number, tracking: number): string {
  const share = step >= 3 ? 1 : step === 2 ? 0.5 : step === 1 ? 0.25 : 0;
  const value = round(tracking * share, 4);
  return `${value === 0 ? 0 : value}em`;
}

export function generateTypography(settings: TypographySettings): TypographyTokens {
  const heading = resolveFont(settings.headingFont, "heading");
  const body = resolveFont(settings.bodyFont, "body");
  const mono = settings.monoFont ? resolveFont(settings.monoFont, "mono") : null;

  const sizes: TypeSizeToken[] = SIZE_LADDER.map(({ name, step }) => {
    // Even whole pixels. rem is worked out from the rounded px so the two always agree.
    const pxValue = snapFontSize(settings.baseSize * settings.scaleRatio ** step);
    const lineHeightPx = lineHeightPxFor(pxValue, step, settings.lineHeight);
    return {
      name,
      step,
      px: pxValue,
      rem: round(pxValue / 16, 4),
      lineHeight: round(lineHeightPx / pxValue, 3),
      lineHeightPx,
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
