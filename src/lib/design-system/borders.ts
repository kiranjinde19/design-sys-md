/** Border generator: a width and a neutral step in, a set of border colors out. */

import { SCALE_STEPS, type BorderSettings, type BorderTokens, type ColorScale } from "./types";

export function generateBorders(settings: BorderSettings, neutral: ColorScale): BorderTokens {
  const index = SCALE_STEPS.indexOf(settings.colorStep);
  const at = (i: number) => neutral[SCALE_STEPS[Math.min(SCALE_STEPS.length - 1, Math.max(0, i))]];

  return {
    width: settings.width,
    color: at(index),
    colorSubtle: at(index - 1),
    colorStrong: at(index + 1),
  };
}
