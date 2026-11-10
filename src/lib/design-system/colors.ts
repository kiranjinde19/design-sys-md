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
import { checkContrast, contrastLevels, contrastRatio, pickReadableText, relativeLuminance } from "./contrast";
import {
  BRAND_STEP,
  SCALE_STEPS,
  type ColorRef,
  type ColorScale,
  type ColorSettings,
  type ColorTokens,
  type ColorRoleTokenName,
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

/** Secondary colors should never be mistaken for the status colors, so suggestions keep clear of them. */
const KEEP_CLEAR_OF: SemanticName[] = ["warning", "error"];
const KEEP_CLEAR_DEGREES = 45;

const hueDistance = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

/** True if a color sits close to the warning or error hue, where it could be mistaken for a status color. */
export function isNearStatusHue(hex: string): boolean {
  const { h } = hexToOklch(normalizeHex(hex) ?? FALLBACK_BRAND);
  return KEEP_CLEAR_OF.some(
    (name) => hueDistance(h, hexToOklch(SEMANTIC_ANCHORS[name]).h) < KEEP_CLEAR_DEGREES,
  );
}

/**
 * Three starting points for an optional secondary color, all derived from the brand
 * color by turning its hue. Turns that would land close to the warning or error
 * hues are skipped. The first suggestion is always the safest default.
 */
export function suggestSecondaryColors(brandHex: string): SecondarySuggestion[] {
  const { l, c, h } = hexToOklch(normalizeHex(brandHex) ?? FALLBACK_BRAND);
  const avoid = KEEP_CLEAR_OF.map((name) => hexToOklch(SEMANTIC_ANCHORS[name]).h);

  const candidates = [
    { label: "Analogous", turn: 30 },
    { label: "Split complement", turn: 150 },
    { label: "Complement", turn: 180 },
    { label: "Analogous (other side)", turn: -30 },
    { label: "Split complement (other side)", turn: 210 },
    { label: "Triadic", turn: 120 },
    { label: "Triadic (other side)", turn: 240 },
  ];

  const picked: SecondarySuggestion[] = [];
  for (const { label, turn } of candidates) {
    const hue = (h + turn + 360) % 360;
    if (avoid.some((target) => hueDistance(hue, target) < KEEP_CLEAR_DEGREES)) continue;
    picked.push({
      label,
      hex: oklchToHex({ l: clamp(l, 0.55, 0.7), c: Math.max(c * 0.9, 0.12), h: hue }),
    });
    if (picked.length === 3) break;
  }
  return picked;
}

/**
 * The lightest shade of a scale that reaches a contrast ratio against a background.
 * Steps are coarse, so if the target falls between two steps, an in-between shade is
 * generated, which keeps the result as light as the target allows.
 */
export function lightestShadeReaching(scale: ColorScale, background: string, target: number): string {
  const steps = SCALE_STEPS.map((step) => scale[step]);
  const lightBackground = relativeLuminance(background) > 0.4;
  // Walk away from the background: light backgrounds go down the scale to black, dark ones up to white.
  const path = lightBackground ? [...steps, BLACK] : [...steps].reverse().concat(WHITE);
  const reaches = (hex: string) => contrastRatio(hex, background) >= target;

  const first = path.findIndex(reaches);
  if (first === -1) return path[path.length - 1];
  if (first === 0) return path[0];

  const from = hexToOklch(path[first - 1]);
  const to = hexToOklch(path[first]);
  const mix = (t: number) =>
    oklchToHex({ l: from.l + (to.l - from.l) * t, c: from.c + (to.c - from.c) * t, h: from.h });

  let low = 0;
  let high = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2;
    if (reaches(mix(mid))) high = mid;
    else low = mid;
  }
  // Rounding to a hex color can land a hair under the target, so nudge until it truly passes.
  let t = high;
  let hex = mix(t);
  while (!reaches(hex) && t < 1) {
    t = Math.min(1, t + 0.004);
    hex = mix(t);
  }
  return hex;
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

  const secondary = settings.secondary ? generateScale(settings.secondary) : null;
  const ink = neutral[900];
  const readable = (bg: string) => pickReadableText(bg, WHITE, ink);
  const r = settings.roles;

  const background = resolve(r.background);
  const foreground = resolve(r.foreground);
  const card = resolve(r.card);
  const primary = resolve(r.primary);
  const muted = resolve(r.muted);
  const destructive = resolve(r.destructive);
  // Secondary and accent use the secondary color's scale when one was added, and the neutral
  // scale when not. Never anything else, so they can not drift toward a status color.
  const quiet = secondary ?? neutral;
  const secondaryFill = quiet[100];
  const accentFill = quiet[100];
  const onQuiet = (bg: string) => (contrastLevels(quiet[900], bg).normal ? quiet[900] : readable(bg));

  // Outlines of form controls must stay visible: the lightest neutral that reaches 3:1.
  const input = lightestShadeReaching(neutral, background, 3);
  // Placeholder text is text, so it needs 4.5:1.
  const placeholder = lightestShadeReaching(neutral, background, 4.5);

  const roles: ColorTokens["roles"] = {
    background,
    foreground,
    card,
    "card-foreground": foreground,
    primary,
    "primary-foreground": readable(primary),
    secondary: secondaryFill,
    "secondary-foreground": onQuiet(secondaryFill),
    muted,
    "muted-foreground": resolve(r["muted-foreground"]),
    accent: accentFill,
    "accent-foreground": onQuiet(accentFill),
    destructive,
    "destructive-foreground": readable(destructive),
    border: resolve(r.border),
    input,
    ring: resolve(r.ring),
  };

  const pair = (
    foregroundRole: ColorRoleTokenName | "placeholder",
    backgroundRole: ColorRoleTokenName,
    kind: "text" | "ui" = "text",
    label = `${foregroundRole} on ${backgroundRole}`,
  ): ContrastPair => {
    const fg = foregroundRole === "placeholder" ? placeholder : roles[foregroundRole];
    const bg = roles[backgroundRole];
    const levels = contrastLevels(fg, bg);
    const required = kind === "text" ? 4.5 : 3;
    return {
      id: `${foregroundRole}-on-${backgroundRole}`,
      label,
      foregroundRole,
      backgroundRole,
      foreground: fg,
      background: bg,
      kind,
      required,
      passes: kind === "text" ? levels.normal : levels.large,
      levels,
      result: checkContrast(fg, bg),
    };
  };

  const contrastPairs: ContrastPair[] = [
    // Every shadcn foreground on its own background
    pair("foreground", "background"),
    pair("card-foreground", "card"),
    pair("primary-foreground", "primary"),
    pair("secondary-foreground", "secondary"),
    pair("muted-foreground", "muted"),
    pair("accent-foreground", "accent"),
    pair("destructive-foreground", "destructive"),
    // Common real-world combinations
    pair("muted-foreground", "background"),
    pair("primary", "background", "text", "primary as link text on background"),
    // Interface parts the user must be able to see, held to 3:1.
    // Decorative borders and dividers have no WCAG requirement, so they are not checked.
    pair("input", "background", "ui", "input border on background"),
    pair("placeholder", "background", "text", "placeholder text on input background"),
    pair("ring", "background", "ui", "focus ring on background"),
  ];

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

  return { brand, secondary, neutral, semantic, roles, placeholder, contrastPairs, reports };
}
