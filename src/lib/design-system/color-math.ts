/**
 * Color conversion helpers.
 *
 * Scales are built in OKLCH, a color space where "lightness" matches what the
 * eye sees. That keeps a generated scale evenly stepped, which HSL does not.
 */

import { clamp, round } from "./units";

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Oklch {
  /** Lightness, 0 to 1. */
  l: number;
  /** Chroma (colorfulness), roughly 0 to 0.4. */
  c: number;
  /** Hue angle in degrees. */
  h: number;
}

/** Accepts "#abc", "abc", "#aabbcc". Returns "#AABBCC", or null if invalid. */
export function normalizeHex(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let hex = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    hex = hex
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : null;
}

export function hexToRgb(hex: string): Rgb {
  const h = normalizeHex(hex) ?? "#000000";
  return {
    r: parseInt(h.slice(1, 3), 16),
    g: parseInt(h.slice(3, 5), 16),
    b: parseInt(h.slice(5, 7), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const part = (v: number) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

/** sRGB channel (0 to 255) to linear light (0 to 1). */
export function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Linear light (0 to 1) to sRGB channel (0 to 255). */
function fromLinear(linear: number): number {
  const c = clamp(linear, 0, 1);
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return v * 255;
}

export function hexToOklch(hex: string): Oklch {
  const { r, g, b } = hexToRgb(hex);
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const c = Math.hypot(a, bb);
  const h = (Math.atan2(bb, a) * 180) / Math.PI;
  return { l: L, c, h: h < 0 ? h + 360 : h };
}

function oklchToLinearRgb({ l, c, h }: Oklch): [number, number, number] {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);

  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

const inGamut = (rgb: [number, number, number]) =>
  rgb.every((v) => v >= -0.0001 && v <= 1.0001);

/**
 * OKLCH to hex. If the color is too vivid to display, chroma is reduced
 * (lightness and hue are kept) until it fits.
 */
export function oklchToHex(color: Oklch): string {
  const l = clamp(color.l, 0, 1);
  const { h } = color;
  let c = Math.max(0, color.c);

  let linear = oklchToLinearRgb({ l, c, h });
  if (!inGamut(linear)) {
    let low = 0;
    let high = c;
    for (let i = 0; i < 24; i++) {
      const mid = (low + high) / 2;
      if (inGamut(oklchToLinearRgb({ l, c: mid, h }))) low = mid;
      else high = mid;
    }
    c = low;
    linear = oklchToLinearRgb({ l, c, h });
  }

  return rgbToHex({
    r: fromLinear(linear[0]),
    g: fromLinear(linear[1]),
    b: fromLinear(linear[2]),
  });
}

/** Make a color lighter (positive) or darker (negative). Used for hover and pressed states. */
export function shiftLightness(hex: string, delta: number): string {
  const color = hexToOklch(hex);
  return oklchToHex({ ...color, l: color.l + delta });
}

/** CSS color with transparency, e.g. "rgb(79 70 229 / 0.3)". */
export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r} ${g} ${b} / ${round(clamp(alpha, 0, 1), 3)})`;
}
