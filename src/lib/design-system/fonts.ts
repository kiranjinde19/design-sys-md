/**
 * The curated font list. All fonts come from Google Fonts. This file and the design
 * system settings are the only places font names are written down.
 *
 * Weights are the ones Google Fonts really offers (checked against its metadata).
 * Asking Google for a weight a font does not have fails the whole request, so
 * nothing outside this list is ever requested. Weights above 900 are left out.
 */

import type { FontCategory, FontChoice, FontWeight } from "./types";

export interface FontEntry {
  name: string;
  category: FontCategory;
  /** Short descriptive tags. "neutral" and "workhorse" mark safe body fonts, "display" marks headline-only fonts. */
  tags: string[];
  /** Weights the font offers, from 100 to 900. */
  weights: FontWeight[];
}

const w = (...weights: FontWeight[]) => weights;
const ALL = w(100, 200, 300, 400, 500, 600, 700, 800, 900);

export const FONT_CATALOG: FontEntry[] = [
  // Sans
  { name: "Inter", category: "sans", tags: ["neutral", "workhorse", "interface"], weights: ALL },
  { name: "Geist", category: "sans", tags: ["neutral", "modern", "technical"], weights: ALL },
  { name: "DM Sans", category: "sans", tags: ["geometric", "friendly", "workhorse"], weights: ALL },
  { name: "Plus Jakarta Sans", category: "sans", tags: ["friendly", "geometric", "modern"], weights: w(200, 300, 400, 500, 600, 700, 800) },
  { name: "Manrope", category: "sans", tags: ["modern", "geometric", "clean"], weights: w(200, 300, 400, 500, 600, 700, 800) },
  { name: "Outfit", category: "sans", tags: ["geometric", "friendly", "expressive"], weights: ALL },
  { name: "Figtree", category: "sans", tags: ["friendly", "neutral", "workhorse"], weights: w(300, 400, 500, 600, 700, 800, 900) },
  { name: "Work Sans", category: "sans", tags: ["neutral", "workhorse", "humanist"], weights: ALL },
  { name: "IBM Plex Sans", category: "sans", tags: ["technical", "workhorse", "humanist"], weights: w(100, 200, 300, 400, 500, 600, 700) },
  { name: "Public Sans", category: "sans", tags: ["neutral", "workhorse", "plain"], weights: ALL },
  { name: "Source Sans 3", category: "sans", tags: ["neutral", "workhorse", "humanist"], weights: w(200, 300, 400, 500, 600, 700, 800, 900) },
  { name: "Nunito Sans", category: "sans", tags: ["friendly", "humanist", "workhorse"], weights: w(200, 300, 400, 500, 600, 700, 800, 900) },
  { name: "Space Grotesk", category: "sans", tags: ["technical", "expressive", "quirky"], weights: w(300, 400, 500, 600, 700) },
  { name: "Sora", category: "sans", tags: ["modern", "geometric", "expressive"], weights: w(100, 200, 300, 400, 500, 600, 700, 800) },
  { name: "Instrument Sans", category: "sans", tags: ["refined", "modern", "neutral"], weights: w(400, 500, 600, 700) },
  { name: "Onest", category: "sans", tags: ["modern", "neutral", "workhorse"], weights: ALL },
  { name: "Bricolage Grotesque", category: "sans", tags: ["expressive", "display", "bold"], weights: w(200, 300, 400, 500, 600, 700, 800) },
  // Serif
  { name: "Fraunces", category: "serif", tags: ["expressive", "display", "editorial", "soft"], weights: ALL },
  { name: "Playfair Display", category: "serif", tags: ["display", "editorial", "classic"], weights: w(400, 500, 600, 700, 800, 900) },
  { name: "Lora", category: "serif", tags: ["classic", "readable", "editorial"], weights: w(400, 500, 600, 700) },
  { name: "Source Serif 4", category: "serif", tags: ["classic", "readable", "workhorse"], weights: w(200, 300, 400, 500, 600, 700, 800, 900) },
  { name: "Newsreader", category: "serif", tags: ["editorial", "readable", "refined"], weights: w(200, 300, 400, 500, 600, 700, 800) },
  { name: "Instrument Serif", category: "serif", tags: ["display", "refined", "editorial"], weights: w(400) },
  { name: "DM Serif Display", category: "serif", tags: ["display", "classic", "high-contrast"], weights: w(400) },
  { name: "Merriweather", category: "serif", tags: ["classic", "readable", "sturdy"], weights: w(300, 400, 500, 600, 700, 800, 900) },
  // Mono
  { name: "Geist Mono", category: "mono", tags: ["technical", "neutral", "modern"], weights: ALL },
  { name: "JetBrains Mono", category: "mono", tags: ["technical", "coding", "readable"], weights: w(100, 200, 300, 400, 500, 600, 700, 800) },
  { name: "IBM Plex Mono", category: "mono", tags: ["technical", "humanist", "sturdy"], weights: w(100, 200, 300, 400, 500, 600, 700) },
  { name: "Fira Code", category: "mono", tags: ["technical", "coding", "ligatures"], weights: w(300, 400, 500, 600, 700) },
  { name: "Space Mono", category: "mono", tags: ["quirky", "expressive", "retro"], weights: w(400, 700) },
  { name: "DM Mono", category: "mono", tags: ["friendly", "light", "clean"], weights: w(300, 400, 500) },
];

export const FONT_CATEGORY_LABELS: Record<FontCategory, string> = {
  sans: "Sans",
  serif: "Serif",
  mono: "Mono",
};

export const WEIGHT_LABELS: Record<number, string> = {
  100: "Thin",
  200: "Extra light",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "Semibold",
  700: "Bold",
  800: "Extra bold",
  900: "Black",
};

/** System fallbacks appended to every stack, so text never goes blank while a font loads. */
export const SYSTEM_STACKS: Record<FontCategory, string> = {
  sans: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
  serif: `ui-serif, Georgia, Cambria, "Times New Roman", serif`,
  mono: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace`,
};

/** The font used when a saved or typed name is not in the list. */
export const DEFAULT_FONT_NAME = "Inter";

const byName = new Map(FONT_CATALOG.map((font) => [font.name, font]));

export const getFont = (name: string): FontEntry | undefined => byName.get(name);

export const catalogFont = (name: string): FontChoice => ({ kind: "catalog", name });

/** A "display" or "decorative" font is made for big headlines and wears out at body sizes. */
export const isDisplayFont = (font: FontEntry): boolean =>
  font.tags.includes("display") || font.tags.includes("decorative");

/** The font whose files are actually used: the font itself, or the fallback of a brand font. */
export function effectiveFont(choice: FontChoice): FontEntry {
  const name = choice.kind === "brand" ? choice.fallback : choice.name;
  return getFont(name) ?? getFont(DEFAULT_FONT_NAME)!;
}

export const offeredWeights = (choice: FontChoice): FontWeight[] => effectiveFont(choice).weights;

/** The offered weight closest to the wanted one. Ties go to the heavier weight. */
export function nearestWeight(wanted: number, offered: readonly number[]): FontWeight {
  const pool = offered.length ? offered : [400];
  let best = pool[0];
  for (const weight of pool) {
    const gap = Math.abs(weight - wanted);
    const bestGap = Math.abs(best - wanted);
    if (gap < bestGap || (gap === bestGap && weight > best)) best = weight;
  }
  return best as FontWeight;
}

/**
 * Brand font names end up inside generated CSS, so anything that could break out of a
 * quoted font name is removed.
 */
export function sanitizeFontName(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.replace(/["'\;{}<>()\n\r\t]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
}
