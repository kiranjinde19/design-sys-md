/**
 * Elevation generator: levels, intensity and style in, ready-to-use shadows out.
 *
 * Level 0 is always "none". Each higher level lifts the surface further.
 *  - soft: two blurred layers (a tight contact shadow and a wide ambient one).
 *  - hard: one offset shadow with no blur.
 *  - brand-tinted: like soft, but tinted with the brand color instead of gray.
 */

import { withAlpha } from "./color-math";
import type {
  ColorScale,
  ElevationSettings,
  ElevationTokens,
  ShadowLayer,
  ShadowToken,
} from "./types";
import { clamp, round } from "./units";

// Per level (1 to 5). Alpha values are the "medium" (intensity 50) strength.
const SOFT_CONTACT = {
  y: [1, 1, 2, 4, 6],
  blur: [2, 3, 6, 10, 16],
  spread: [0, 0, 0, -1, -2],
  alpha: [0.06, 0.07, 0.08, 0.09, 0.1],
};
const SOFT_AMBIENT = {
  y: [2, 4, 8, 16, 28],
  blur: [4, 8, 16, 32, 56],
  spread: [0, -1, -2, -4, -6],
  alpha: [0.04, 0.06, 0.08, 0.1, 0.12],
};
const HARD = {
  offset: [1, 2, 3, 4, 6],
  alpha: [0.12, 0.16, 0.2, 0.24, 0.28],
};

/** Intensity 50 is medium (1x). 0 is almost invisible, 100 is twice as strong. */
const strengthFor = (intensity: number) => clamp(intensity / 50, 0.1, 2);

function layerCss({ x, y, blur, spread, color }: ShadowLayer): string {
  return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
}

export function generateElevation(
  settings: ElevationSettings,
  colors: { neutral: ColorScale; brand: ColorScale },
): ElevationTokens {
  const strength = strengthFor(settings.intensity);
  const tint = settings.style === "brand-tinted" ? colors.brand[700] : colors.neutral[900];
  const alpha = (value: number) => round(clamp(value * strength, 0, 0.6), 3);

  const shadows: ShadowToken[] = [{ level: 0, css: "none", layers: [] }];

  for (let level = 1; level <= settings.levels; level++) {
    const i = level - 1;
    const layers: ShadowLayer[] =
      settings.style === "hard"
        ? [
            {
              x: HARD.offset[i],
              y: HARD.offset[i],
              blur: 0,
              spread: 0,
              color: withAlpha(tint, alpha(HARD.alpha[i])),
            },
          ]
        : [
            {
              x: 0,
              y: SOFT_CONTACT.y[i],
              blur: SOFT_CONTACT.blur[i],
              spread: SOFT_CONTACT.spread[i],
              color: withAlpha(tint, alpha(SOFT_CONTACT.alpha[i])),
            },
            {
              x: 0,
              y: SOFT_AMBIENT.y[i],
              blur: SOFT_AMBIENT.blur[i],
              spread: SOFT_AMBIENT.spread[i],
              color: withAlpha(tint, alpha(SOFT_AMBIENT.alpha[i])),
            },
          ];
    shadows.push({ level, css: layers.map(layerCss).join(", "), layers });
  }

  return { levels: settings.levels, intensity: settings.intensity, style: settings.style, shadows };
}

/** Picks a shadow by level, using the highest available level if the system has fewer. */
export function shadowAt(elevation: ElevationTokens, level: number): string {
  const found = elevation.shadows[Math.min(level, elevation.shadows.length - 1)];
  return found.css;
}
