/**
 * Clean-up for older saved work.
 *
 * Earlier, ticking "Add a secondary color" auto-picked a "split complement" shade of the
 * brand color. For many brands that landed next to the warning amber, so secondary buttons
 * turned a warm tan. That default has been fixed, but browsers that autosaved it still hold
 * it. This removes exactly that auto-picked color, and only when it sits near the warning
 * or error hue. A secondary color chosen on purpose is never touched.
 */

import { hexToOklch, oklchToHex } from "./color-math";
import { isNearStatusHue } from "./colors";
import type { DesignSystemSettings } from "./types";
import { clamp } from "./units";

/** The two versions of the old auto-pick (they differed only in lightness limits). */
function legacyAutoPicks(brand: string): string[] {
  const { l, c, h } = hexToOklch(brand);
  return [
    [0.5, 0.65],
    [0.55, 0.7],
  ].map(([low, high]) => oklchToHex({ l: clamp(l, low, high), c: Math.max(c * 0.9, 0.12), h: (h + 150) % 360 }));
}

export function dropLegacyAutoSecondary(settings: DesignSystemSettings): DesignSystemSettings {
  const { secondary, brand } = settings.colors;
  if (!secondary) return settings;
  const wasAutoPicked = legacyAutoPicks(brand).includes(secondary);
  if (!wasAutoPicked || !isNearStatusHue(secondary)) return settings;
  return { ...settings, colors: { ...settings.colors, secondary: null } };
}
