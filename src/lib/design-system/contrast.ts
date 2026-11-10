/** WCAG 2.x contrast checking. */

import { hexToRgb, toLinear } from "./color-math";
import type { ContrastLevels, ContrastResult, WcagLevel } from "./types";

export const WCAG_AAA = 7;
export const WCAG_AA = 4.5;
export const WCAG_AA_LARGE = 3;

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** Contrast ratio between two colors, from 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Checks text (foreground) on a background and returns a pass/fail label. */
export function checkContrast(foreground: string, background: string): ContrastResult {
  const exact = contrastRatio(foreground, background);
  const level: WcagLevel =
    exact >= WCAG_AAA ? "AAA" : exact >= WCAG_AA ? "AA" : exact >= WCAG_AA_LARGE ? "AA Large" : "Fail";
  // Round down, so 4.497 is shown as 4.49 and never looks like a pass.
  const ratio = Math.floor(exact * 100) / 100;
  return {
    ratio,
    level,
    passesAA: exact >= WCAG_AA,
    passesAAA: exact >= WCAG_AAA,
    passesAALarge: exact >= WCAG_AA_LARGE,
    label: `${level} ${ratio.toFixed(2)}:1`,
  };
}

/**
 * All three WCAG thresholds for one color pair.
 *  - normal: 4.5:1, body text (AA)
 *  - large:  3:1, large text and UI parts such as borders, icons and focus rings
 *  - aaa:    7:1, enhanced contrast (AAA)
 */
export function contrastLevels(foreground: string, background: string): ContrastLevels {
  const exact = contrastRatio(foreground, background);
  return {
    ratio: Math.floor(exact * 100) / 100,
    normal: exact >= WCAG_AA,
    large: exact >= WCAG_AA_LARGE,
    aaa: exact >= WCAG_AAA,
  };
}

/** Of two candidate text colors, returns the one that reads better on the background. */
export function pickReadableText(background: string, light: string, dark: string): string {
  return contrastRatio(light, background) >= contrastRatio(dark, background) ? light : dark;
}
