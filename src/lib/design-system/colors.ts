/**
 * Color generator: one brand color in, a full color system out.
 *
 *  - brand scale: 10 steps (50 to 900). The exact brand color sits at step 600.
 *  - neutral scale: 10 grays with a faint tint (cool, warm, pure, or brand).
 *  - semantic scales: success, warning, error, info.
 *  - roles: which swatch does which job (primary, background, text...).
 *  - contrast pairs: the key text/background combinations, each checked against WCAG.
 */

import { hexToOklch, hslHue, normalizeHex, oklchToHex } from "./color-math";
import { checkContrast, contrastLevels, pickReadableText } from "./contrast";
import {
  BRAND_STEP,
  SCALE_STEPS,
  type ColorRef,
  type ColorScale,
  type ColorSettings,
  type ColorTokens,
  type ContrastPair,
  type ScaleGuidance,
  type ScaleReport,
  type ScaleStep,
  type NeutralTone,
  type ScaleName,
  type SemanticName,
} from "./types";
import { clamp } from "./units";

export const WHITE = "#FFFFFF";
export const BLACK = "#000000";

/** Used if a brand color is ever invalid. */
const FALLBACK_BRAND = "#4F46E5";

/** Starting colors for the semantic scales. Each one lands at step 600. */
const SEMANTIC_ANCHORS: Record<SemanticName, string> = {
  success: "#16A34A",
  warning: "#D97706",
  error: "#DC2626",
  info: "#2563EB",
};

// How far each step travels from the lightest tint to the brand color (steps 50 to 500),
// and from the brand color to the darkest shade (steps 700 to 900).
const LIGHT_POSITION = [0, 0.1, 0.22, 0.4, 0.62, 0.82];
const LIGHT_CHROMA = [0.08, 0.2, 0.4, 0.62, 0.82, 0.94];
const DARK_POSITION = [1 / 3, 2 / 3, 1];
// Dark steps are a little less saturated than the brand color, so they read as a deeper
// version of it instead of drifting toward a neon violet.
const DARK_CHROMA = [0.92, 0.76, 0.58];

const BRAND_INDEX = SCALE_STEPS.indexOf(BRAND_STEP);

const hueGap = (target: number, current: number) => ((target - current + 540) % 360) - 180;

/**
 * Same lightness and chroma, but the hue is nudged until the finished hex color shows the
 * same hue as the brand color in HSL. Without this, dark blues drift toward violet.
 */
function darkStep(l: number, c: number, h: number, targetHue: number | null): string {
  let hue = h;
  let hex = oklchToHex({ l, c, h: hue });
  if (targetHue === null || c < 0.02) return hex;
  for (let i = 0; i < 8; i++) {
    const current = hslHue(hex);
    if (current === null) break;
    const gap = hueGap(targetHue, current);
    if (Math.abs(gap) < 1.5) break;
    hue += gap * 0.8;
    hex = oklchToHex({ l, c, h: hue });
  }
  return hex;
}

/** Builds a 10 step scale around one anchor color, which is kept exactly at step 600. */
export function generateScale(anchorHex: string): ColorScale {
  const anchor = normalizeHex(anchorHex) ?? FALLBACK_BRAND;
  const { l, c, h } = hexToOklch(anchor);

  const top = Math.max(l, Math.min(0.995, Math.max(0.975, l + 0.015)));
  const bottom = Math.min(l, clamp(l - 0.12, 0.12, 0.26));

  const targetHue = hslHue(anchor);
  const scale = {} as ColorScale;
  SCALE_STEPS.forEach((step, index) => {
    if (index === BRAND_INDEX) {
      scale[step] = anchor;
    } else if (index < BRAND_INDEX) {
      scale[step] = oklchToHex({
        l: top + (l - top) * LIGHT_POSITION[index],
        c: c * LIGHT_CHROMA[index],
        h,
      });
    } else {
      const i = index - BRAND_INDEX - 1;
      scale[step] = darkStep(l + (bottom - l) * DARK_POSITION[i], c * DARK_CHROMA[i], h, targetHue);
    }
  });
  return scale;
}

export const generateBrandScale = generateScale;

// Lightness for each neutral step, 50 to 900.
const NEUTRAL_LIGHTNESS = [0.985, 0.967, 0.922, 0.87, 0.708, 0.556, 0.444, 0.371, 0.269, 0.205];

/** A gray scale with a faint tint, so grays feel related to the brand. */
export function generateNeutralScale(tone: NeutralTone, brandHex: string): ColorScale {
  const brand = hexToOklch(normalizeHex(brandHex) ?? FALLBACK_BRAND);
  const tint =
    tone === "cool"
      ? { h: 255, c: 0.011 }
      : tone === "warm"
        ? { h: 75, c: 0.012 }
        : tone === "brand"
          ? { h: brand.h, c: 0.014 }
          : { h: 0, c: 0 };

  const scale = {} as ColorScale;
  SCALE_STEPS.forEach((step, index) => {
    scale[step] = oklchToHex({ l: NEUTRAL_LIGHTNESS[index], c: tint.c, h: tint.h });
  });
  return scale;
}

export interface SecondarySuggestion {
  label: string;
  hex: string;
}

/**
 * Three starting points for an optional secondary color, all derived from the brand
 * color by turning its hue. The user can pick one or type their own.
 */
export function suggestSecondaryColors(brandHex: string): SecondarySuggestion[] {
  const { l, c, h } = hexToOklch(normalizeHex(brandHex) ?? FALLBACK_BRAND);
  const make = (turn: number) =>
    oklchToHex({ l: clamp(l, 0.55, 0.7), c: Math.max(c * 0.9, 0.12), h: (h + turn) % 360 });
  return [
    { label: "Analogous", hex: make(30) },
    { label: "Split complement", hex: make(150) },
    { label: "Complement", hex: make(180) },
  ];
}

export function generateSemanticScales(): Record<SemanticName, ColorScale> {
  return {
    success: generateScale(SEMANTIC_ANCHORS.success),
    warning: generateScale(SEMANTIC_ANCHORS.warning),
    error: generateScale(SEMANTIC_ANCHORS.error),
    info: generateScale(SEMANTIC_ANCHORS.info),
  };
}

type Scales = Record<Exclude<ScaleName, SemanticName>, ColorScale> & {
  semantic: Record<SemanticName, ColorScale>;
};

/** Turns a pointer like { scale: "neutral", step: 200 } into an actual hex color. */
export function resolveColorRef(ref: ColorRef, scales: Scales): string {
  if (!("step" in ref)) return ref.scale === "white" ? WHITE : BLACK;
  if (ref.scale === "brand") return scales.brand[ref.step];
  if (ref.scale === "neutral") return scales.neutral[ref.step];
  return scales.semantic[ref.scale][ref.step];
}

/** Contrast at three levels for every step, and which steps are safe as filled backgrounds. */
export function generateScaleReport(scale: ColorScale, ink: string): ScaleReport {
  const contrast = {} as ScaleReport["contrast"];
  for (const step of SCALE_STEPS) {
    contrast[step] = {
      onWhite: contrastLevels(scale[step], WHITE),
      onBlack: contrastLevels(scale[step], BLACK),
    };
  }

  const steps: readonly ScaleStep[] = SCALE_STEPS;
  const whiteTextFrom = steps.find((step) => contrastLevels(WHITE, scale[step]).normal) ?? null;
  const darkTextUpTo = [...steps].reverse().find((step) => contrastLevels(ink, scale[step]).normal) ?? null;
  const guidance: ScaleGuidance = { whiteTextFrom, darkTextUpTo };

  return { contrast, guidance };
}

export function generateColors(settings: ColorSettings): ColorTokens {
  const brand = generateBrandScale(settings.brand);
  const neutral = generateNeutralScale(settings.neutralTone, settings.brand);
  const semantic = generateSemanticScales();
  const scales: Scales = { brand, neutral, semantic };

  const resolve = (ref: ColorRef) => resolveColorRef(ref, scales);

  const primary = resolve(settings.roles.primary);
  const secondary = settings.secondary ? generateScale(settings.secondary) : null;

  const roles: ColorTokens["roles"] = {
    primary,
    primaryForeground: pickReadableText(primary, WHITE, neutral[900]),
    background: resolve(settings.roles.background),
    surface: resolve(settings.roles.surface),
    surfaceMuted: resolve(settings.roles.surfaceMuted),
    border: resolve(settings.roles.border),
    text: resolve(settings.roles.text),
    textMuted: resolve(settings.roles.textMuted),
  };

  if (secondary) {
    roles.secondary = secondary[BRAND_STEP];
    roles.secondaryForeground = pickReadableText(roles.secondary, WHITE, neutral[900]);
  }

  const pair = (id: string, label: string, foreground: string, background: string): ContrastPair => ({
    id,
    label,
    foreground,
    background,
    result: checkContrast(foreground, background),
  });

  const contrastPairs: ContrastPair[] = [
    pair("text-on-background", "Text on background", roles.text, roles.background),
    pair("text-on-surface", "Text on surface", roles.text, roles.surface),
    pair("muted-on-background", "Muted text on background", roles.textMuted, roles.background),
    pair("muted-on-surface", "Muted text on surface", roles.textMuted, roles.surface),
    pair("on-primary", "Text on primary button", roles.primaryForeground, roles.primary),
    pair("primary-on-background", "Primary as link text on background", roles.primary, roles.background),
  ];

  if (roles.secondary && roles.secondaryForeground) {
    contrastPairs.push(
      pair("on-secondary", "Text on secondary button", roles.secondaryForeground, roles.secondary),
    );
  }

  const ink = neutral[900];
  const reports: ColorTokens["reports"] = {
    brand: generateScaleReport(brand, ink),
    secondary: secondary ? generateScaleReport(secondary, ink) : null,
    neutral: generateScaleReport(neutral, ink),
    semantic: {
      success: generateScaleReport(semantic.success, ink),
      warning: generateScaleReport(semantic.warning, ink),
      error: generateScaleReport(semantic.error, ink),
      info: generateScaleReport(semantic.info, ink),
    },
  };

  return { brand, secondary, neutral, semantic, roles, contrastPairs, reports };
}
