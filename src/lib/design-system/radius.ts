/** Radius generator: one number (0 to 24) in, small, medium, large and full out. */

import type { RadiusSettings, RadiusTokens } from "./types";
import { round } from "./units";

/** "Full" is a radius big enough to turn any control into a pill or circle. */
const FULL_RADIUS = 9999;

export function generateRadius({ base }: RadiusSettings): RadiusTokens {
  return {
    sm: round(base * 0.5, 1),
    md: base,
    lg: round(base * 1.6, 1),
    full: FULL_RADIUS,
  };
}
