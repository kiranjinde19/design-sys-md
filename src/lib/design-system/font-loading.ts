/**
 * Builds Google Fonts web addresses. Pure functions, no browser code, so they can be
 * tested and reused when the skill file is written.
 *
 * Three kinds of request exist, and none of them loads the full list:
 *  - selected: only the fonts currently in use, in the weights they offer.
 *  - names: one request for the whole list, carrying only the letters needed to spell
 *    the font names (used by the picker).
 *  - gallery: only the fonts the pairing cards use, carrying only the letters of the
 *    sample sentence.
 * Every request uses display=swap, so text shows immediately in a fallback and swaps
 * when the font arrives.
 */

import { FONT_CATALOG, getFont, nearestWeight } from "./fonts";
import type { FontToken } from "./types";

const API = "https://fonts.googleapis.com/css2";

export interface FontRequest {
  name: string;
  weights: number[];
}

const familyParam = (name: string, weights: number[]) =>
  `family=${encodeURIComponent(name).replace(/%20/g, "+")}${weights.length ? `:wght@${weights.join(";")}` : ""}`;

/** Google rejects any weight a font does not have, so requests are clamped to the offered ones. */
function clampWeights(name: string, weights: number[]): number[] {
  const offered = getFont(name)?.weights ?? [];
  const valid = weights.map((weight) => nearestWeight(weight, offered));
  return [...new Set(valid)].sort((a, b) => a - b);
}

/** Merges requests for the same family, so a font used twice is requested once. */
function merge(requests: FontRequest[]): FontRequest[] {
  const map = new Map<string, Set<number>>();
  for (const { name, weights } of requests) {
    if (!getFont(name)) continue;
    const set = map.get(name) ?? new Set<number>();
    clampWeights(name, weights).forEach((weight) => set.add(weight));
    map.set(name, set);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, set]) => ({ name, weights: [...set].sort((a, b) => a - b) }));
}

/** @param text when given, Google returns a file holding only those characters. */
export function buildFontsUrl(requests: FontRequest[], text?: string): string | null {
  const merged = merge(requests);
  if (merged.length === 0) return null;
  const families = merged.map(({ name, weights }) => familyParam(name, weights)).join("&");
  const subset = text ? `&text=${encodeURIComponent(text)}` : "";
  return `${API}?${families}${subset}&display=swap`;
}

/** The fonts in use right now. Brand fonts load their fallback, which is what previews show. */
export function selectedFontsUrl(fonts: {
  heading: FontToken;
  body: FontToken;
  mono: FontToken | null;
  headingWeight: number;
  bodyWeight: number;
  weights: { regular: number; medium: number; semibold: number; bold: number };
}): string | null {
  const family = (font: FontToken) => font.fallbackName ?? font.name;
  const requests: FontRequest[] = [
    { name: family(fonts.heading), weights: [fonts.headingWeight] },
    {
      name: family(fonts.body),
      weights: [fonts.bodyWeight, fonts.weights.regular, fonts.weights.medium, fonts.weights.semibold, fonts.weights.bold],
    },
  ];
  if (fonts.mono) requests.push({ name: family(fonts.mono), weights: [400, 700] });
  return buildFontsUrl(requests);
}

/** One request for every font name in the list, carrying only the letters those names need. */
export function fontNamesUrl(): string | null {
  const text = [...new Set(FONT_CATALOG.map((font) => font.name).join(""))].sort().join("");
  return buildFontsUrl(
    FONT_CATALOG.map((font) => ({ name: font.name, weights: [] })),
    text,
  );
}

/** The fonts for the pairing cards, carrying only the letters of the sample text. */
export function galleryFontsUrl(requests: FontRequest[], sampleText: string): string | null {
  const text = [...new Set(sampleText)].sort().join("");
  return buildFontsUrl(requests, text);
}
