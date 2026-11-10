/** Icon style tokens. These describe how icons should be drawn, not which icons exist. */

import type { IconSettings, IconTokens } from "./types";

export function generateIcons(settings: IconSettings): IconTokens {
  const round = settings.ends === "round";
  return {
    style: settings.style,
    strokeWidth: settings.strokeWidth,
    strokeLinecap: round ? "round" : "butt",
    strokeLinejoin: round ? "round" : "miter",
    fill: settings.style === "solid" ? "currentColor" : "none",
    duotoneOpacity: 0.2,
    sizes: { sm: 16, md: 20, lg: 24 },
  };
}
