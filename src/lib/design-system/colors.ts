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
import { VISION_KINDS, appearanceOf, seenAs, worstCaseDistance } from "./color-vision";
import { checkContrast, contrastLevels, contrastRatio, pickReadableText, relativeLuminance } from "./contrast";
import {
  BRAND_STEP,
  SCALE_STEPS,
  type ColorRef,
  type ColorScale,
  type ColorSettings,
  type BrandReport,
  type ColorTokens,
  type CardStyle,
  type ChartCheck,
  type VisionKindName,
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

/**
 * The lightest shade that reaches the target on every surface in the list. Darker surfaces
 * are the hardest to beat, so each surface is solved on its own and the darkest answer wins.
 */
export function lightestShadeReachingAll(scale: ColorScale, surfaces: string[], target: number): string {
  const candidates = surfaces.map((surface) => lightestShadeReaching(scale, surface, target));
  const darkest = candidates.reduce((a, b) => (relativeLuminance(b) < relativeLuminance(a) ? b : a));
  return darkest;
}

/** The lightness values tried for each chart color. Nothing darker than 0.44, so no chart color reads as near-black; nothing lighter than 0.67, which fails 3:1 on white. */
const CHART_LIGHTNESS = [0.44, 0.48, 0.52, 0.56, 0.6, 0.64, 0.67];

/** Small turns of the whole wheel that are tried, so the best-separated version can be picked. */
const CHART_HUE_NUDGES = [-12, -6, 0, 6, 12];

/** Two chart colors count as clearly different under every vision type at or above this OKLab distance. */
export const CHART_MIN_DISTANCE = 0.08;

const chartCache = new Map<string, { colors: string[]; check: ChartCheck }>();

/**
 * Five chart colors. Chart 1 is the brand color. The other four sit around the hue wheel at even
 * steps from the brand hue (72 degrees apart, nudged a few degrees at most), and their lightness
 * is searched: of every combination that reaches 3:1 on the background, the one whose closest
 * pair stays furthest apart wins. "Apart" is measured under normal vision, deuteranopia,
 * protanopia and tritanopia, and the result is reported in the returned check.
 */
export function generateChartColors(brand: ColorScale, background: string): { colors: string[]; check: ChartCheck } {
  const key = `${brand[BRAND_STEP]}|${background}`;
  const cached = chartCache.get(key);
  if (cached) return cached;

  const brandOklch = hexToOklch(brand[BRAND_STEP]);
  const reaches = (hex: string) => contrastRatio(hex, background) >= 3;
  const steps: ScaleStep[] = [600, 700, 800, 900];
  const first = brand[steps.find((step) => reaches(brand[step])) ?? 900];
  const firstLook = appearanceOf(first);
  const chroma = Math.min(0.2, Math.max(brandOklch.c, 0.13));

  let best: { score: number; colors: string[]; hues: number[] } = { score: -1, colors: [first], hues: [brandOklch.h] };
  for (const nudge of CHART_HUE_NUDGES) {
    const hues = [1, 2, 3, 4].map((k) => (brandOklch.h + k * 72 + nudge + 360) % 360);
    const options = hues.map((h) =>
      CHART_LIGHTNESS.map((l) => oklchToHex({ l, c: chroma, h }))
        .filter(reaches)
        .map((hex) => ({ hex, look: appearanceOf(hex) })),
    );
    if (options.some((list) => list.length === 0)) continue;
    const [o1, o2, o3, o4] = options;
    for (const a of o1) {
      const dA = worstCaseDistance(firstLook, a.look);
      if (dA <= best.score) continue;
      for (const b of o2) {
        const dB = Math.min(dA, worstCaseDistance(firstLook, b.look), worstCaseDistance(a.look, b.look));
        if (dB <= best.score) continue;
        for (const c of o3) {
          const dC = Math.min(dB, worstCaseDistance(firstLook, c.look), worstCaseDistance(a.look, c.look), worstCaseDistance(b.look, c.look));
          if (dC <= best.score) continue;
          for (const d of o4) {
            const score = Math.min(dC, worstCaseDistance(firstLook, d.look), worstCaseDistance(a.look, d.look), worstCaseDistance(b.look, d.look), worstCaseDistance(c.look, d.look));
            if (score > best.score) best = { score, colors: [first, a.hex, b.hex, c.hex, d.hex], hues: [brandOklch.h, ...hues] };
          }
        }
      }
    }
  }

  const colors = best.colors.length === 5 ? best.colors : [first, ...[1, 2, 3, 4].map((k) => oklchToHex({ l: 0.45, c: chroma, h: (brandOklch.h + k * 72) % 360 }))];
  const check = measureChart(colors, background, best.hues.length === 5 ? best.hues : colors.map((c) => hexToOklch(c).h));
  const result = { colors, check };
  if (chartCache.size > 24) chartCache.clear();
  chartCache.set(key, result);
  return result;
}

/** Measures a chart palette: every pair under every vision type, and contrast on the background. */
function measureChart(colors: string[], background: string, hues: number[]): ChartCheck {
  const perVision = { normal: Infinity, deuteranopia: Infinity, protanopia: Infinity, tritanopia: Infinity } as ChartCheck["perVision"];
  let min = Infinity;
  let worstPair: [number, number] = [1, 2];
  let worstVision: VisionKindName = "normal";
  const looks = colors.map((hex) => VISION_KINDS.map((kind) => seenAs(hex, kind)));
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      VISION_KINDS.forEach((kind, k) => {
        const d = Math.hypot(looks[i][k][0] - looks[j][k][0], looks[i][k][1] - looks[j][k][1], looks[i][k][2] - looks[j][k][2]);
        perVision[kind] = Math.min(perVision[kind], d);
        if (d < min) {
          min = d;
          worstPair = [i + 1, j + 1];
          worstVision = kind;
        }
      });
    }
  }
  const round3 = (n: number) => Math.round(n * 1000) / 1000;
  return {
    hues: hues.map((h) => Math.round(h)),
    minDistance: round3(min),
    worstPair,
    worstVision,
    threshold: CHART_MIN_DISTANCE,
    passes: min >= CHART_MIN_DISTANCE,
    minContrast: Math.floor(Math.min(...colors.map((hex) => contrastRatio(hex, background))) * 100) / 100,
    perVision: { normal: round3(perVision.normal), deuteranopia: round3(perVision.deuteranopia), protanopia: round3(perVision.protanopia), tritanopia: round3(perVision.tritanopia) },
  };
}

/**
 * A darker or lighter version of a color that keeps its hue, so a hover state of an indigo
 * button stays indigo and does not drift toward violet. Chroma is eased down a little.
 */
export function shiftKeepingHue(hex: string, delta: number, chromaScale = 1): string {
  const { l, c, h } = hexToOklch(hex);
  return darkStep(clamp(l + delta, 0, 1), c * chromaScale, h, hslHue(hex));
}

/** Below this OKLCH lightness a fill counts as very dark (like #111827). */
export const VERY_DARK_LIGHTNESS = 0.3;

/** Brand hues closer than this to the error hue make a solid destructive button look like the primary one. */
export const ERROR_CLASH_DEGREES = 20;

/** The nearest color with the same hue and chroma where white text reaches 4.5:1. Only the lightness changes. */
export function adjustForWhiteText(hex: string): string {
  const typed = normalizeHex(hex) ?? FALLBACK_BRAND;
  if (contrastRatio(WHITE, typed) >= 4.5) return typed;
  const { l, c, h } = hexToOklch(typed);
  const targetHue = hslHue(typed);
  let lightness = l;
  let out = typed;
  while (contrastRatio(WHITE, out) < 4.5 && lightness > 0.1) {
    lightness -= 0.002;
    out = darkStep(lightness, c, h, targetHue);
  }
  return out;
}

export function generateColors(settings: ColorSettings, options: { cardStyle: CardStyle }): ColorTokens {
  const typed = normalizeHex(settings.brand) ?? FALLBACK_BRAND;
  const whiteOnTyped = contrastRatio(WHITE, typed);
  const whiteFails = whiteOnTyped < 4.5;
  const adjusted = whiteFails ? adjustForWhiteText(typed) : typed;
  const effective = settings.brandMode === "adjusted" && whiteFails ? adjusted : typed;
  const brand = generateBrandScale(effective);
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
  const primary = resolve(r.primary);
  const muted = resolve(r.muted);
  const destructive = resolve(r.destructive);

  // The card role follows the card style. A tinted bento tile is the brand 50 tint with a brand 100
  // border, so bg-card gives the same result as the signature card.
  const tinted = options.cardStyle === "tinted-bento-tile";
  const plainCard = resolve(r.card);
  const card = tinted ? brand[50] : plainCard;
  const cardBorder = tinted ? brand[100] : resolve(r.border);

  // Secondary and accent use the secondary color's scale when one was added, and the neutral
  // scale when not. Never anything else, so they can not drift toward a status color.
  const quiet = secondary ?? neutral;
  const secondaryFill = secondary ? secondary[100] : neutral[200];
  const accentFill = quiet[100];
  const onQuiet = (bg: string) => (contrastLevels(quiet[900], bg).normal ? quiet[900] : readable(bg));

  // Outlines of form controls must stay visible on every surface they can sit on: the page,
  // a card, a muted area, an accent area and the tinted bento tile.
  const tile = brand[50];
  const inputSurfaces = [background, card, muted, accentFill, tile, neutral[50]];
  const input = lightestShadeReachingAll(neutral, inputSurfaces, 3);
  // Placeholder text is text, so it needs 4.5:1.
  const placeholder = lightestShadeReaching(neutral, background, 4.5);

  const { colors: charts, check: chartCheck } = generateChartColors(brand, background);

  // Brand colored text: the first step that reaches 4.5:1 on the page, the 50 tint and the 100 tint.
  const textSurfaces = [background, brand[50], brand[100]];
  const TEXT_STEPS = [600, 700, 800, 900] as const;
  const textIndex = TEXT_STEPS.findIndex((step) => textSurfaces.every((surface) => contrastRatio(brand[step], surface) >= 4.5));
  const textStep = textIndex === -1 ? null : TEXT_STEPS[textIndex];
  const brandText = textStep === null ? ink : brand[textStep];
  const darker = (by: number) => (textIndex === -1 ? ink : brand[TEXT_STEPS[Math.min(textIndex + by, TEXT_STEPS.length - 1)]]);
  // The focus ring and the focus border of controls: the first step that reaches 3:1 on the page and the tinted tile.
  const focusSurfaces = [background, brand[50], card];
  const FOCUS_STEPS = [500, 600, 700, 800, 900] as const;
  const focusStep = FOCUS_STEPS.find((step) => focusSurfaces.every((surface) => contrastRatio(brand[step], surface) >= 3));
  const errorHue = hexToOklch(SEMANTIC_ANCHORS.error).h;
  const brandOklch = hexToOklch(effective);
  const nearError = brandOklch.c > 0.06 && hueDistance(brandOklch.h, errorHue) < ERROR_CLASH_DEGREES;
  // A brand close to the error red would make a focused field look like an error field, so focus is the
  // neutral dark foreground color then.
  const focus = nearError || focusStep === undefined ? foreground : brand[focusStep];
  const UI_STEPS = [600, 700, 800, 900] as const;
  const uiStep = UI_STEPS.find((step) => focusSurfaces.every((surface) => contrastRatio(brand[step], surface) >= 3)) ?? null;
  const ui = uiStep === null ? foreground : brand[uiStep];
  // Very dark: white text sits on a fill whose lightness is so low that darker hover shades are not visible.
  const veryDark = hexToOklch(primary).l < VERY_DARK_LIGHTNESS && contrastRatio(WHITE, primary) >= 4.5;
  const primaryText = readable(primary);
  const brandReport: BrandReport = {
    typed,
    mode: settings.brandMode === "adjusted" ? "adjusted" : "exact",
    whiteOnTyped: Math.floor(whiteOnTyped * 100) / 100,
    whiteFails,
    adjusted,
    effective,
    primaryText: { hex: primaryText, ratio: Math.floor(contrastRatio(primaryText, primary) * 100) / 100, isWhite: primaryText.toUpperCase() === WHITE },
    textStep,
    text: brandText,
    link: { hover: darker(1), pressed: darker(2), visited: darker(3) },
    focus,
    nearError,
    ui,
    uiStep,
    veryDark,
  };

  const roles: ColorTokens["roles"] = {
    background,
    foreground,
    card,
    "card-foreground": foreground,
    // A popover is a floating menu, so it keeps the plain card color even when cards are tinted.
    popover: plainCard,
    "popover-foreground": foreground,
    primary,
    "primary-foreground": primaryText,
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
    ring: !nearError && contrastRatio(resolve(r.ring), background) >= 3 && contrastRatio(resolve(r.ring), card) >= 3 ? resolve(r.ring) : focus,
    "chart-1": charts[0],
    "chart-2": charts[1],
    "chart-3": charts[2],
    "chart-4": charts[3],
    "chart-5": charts[4],
    "card-border": cardBorder,
    sidebar: neutral[50],
    "sidebar-foreground": foreground,
    "sidebar-primary": primary,
    "sidebar-primary-foreground": readable(primary),
    "sidebar-accent": accentFill,
    "sidebar-accent-foreground": onQuiet(accentFill),
    "sidebar-border": resolve(r.border),
    "sidebar-ring": !nearError && contrastRatio(resolve(r.ring), background) >= 3 ? resolve(r.ring) : focus,
  };

  type Surface = ColorRoleTokenName | { name: "tinted-tile"; hex: string };
  const pair = (
    foregroundRole: ColorRoleTokenName | "placeholder",
    surface: Surface,
    kind: "text" | "ui" = "text",
    label?: string,
  ): ContrastPair => {
    const fg = foregroundRole === "placeholder" ? placeholder : roles[foregroundRole];
    const backgroundRole = typeof surface === "string" ? surface : surface.name;
    const bg = typeof surface === "string" ? roles[surface] : surface.hex;
    const levels = contrastLevels(fg, bg);
    const required = kind === "text" ? 4.5 : 3;
    return {
      id: `${foregroundRole}-on-${backgroundRole}`,
      label: label ?? `${foregroundRole} on ${backgroundRole}`,
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
    pair("popover-foreground", "popover"),
    pair("primary-foreground", "primary"),
    pair("secondary-foreground", "secondary"),
    pair("muted-foreground", "muted"),
    pair("accent-foreground", "accent"),
    pair("destructive-foreground", "destructive"),
    pair("sidebar-foreground", "sidebar"),
    pair("sidebar-primary-foreground", "sidebar-primary"),
    pair("sidebar-accent-foreground", "sidebar-accent"),
    // Common real-world combinations
    pair("muted-foreground", "background"),
    pair("placeholder", "background", "text", "placeholder text on input background"),
    // Interface parts the user must be able to see, held to 3:1. The input border is checked on
    // every surface it can sit on. Decorative borders and dividers have no WCAG requirement.
    pair("input", "background", "ui", "input border on background"),
    pair("input", "card", "ui", "input border on card"),
    pair("input", "muted", "ui", "input border on muted"),
    pair("input", "accent", "ui", "input border on accent"),
    pair("input", { name: "tinted-tile", hex: tile }, "ui", "input border on tinted bento tile"),
    pair("ring", "background", "ui", "focus ring on background"),
    // Chart colors, each on the page background
    pair("chart-1", "background", "ui", "chart 1 on background"),
    pair("chart-2", "background", "ui", "chart 2 on background"),
    pair("chart-3", "background", "ui", "chart 3 on background"),
    pair("chart-4", "background", "ui", "chart 4 on background"),
    pair("chart-5", "background", "ui", "chart 5 on background"),
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

  return { brand, brandReport, secondary, neutral, semantic, roles, placeholder, chartCheck, contrastPairs, reports };
}
