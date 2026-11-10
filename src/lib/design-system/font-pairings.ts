/** Ready-made font pairings, body font recommendations, and font warnings. */

import { galleryFontsUrl, type FontRequest } from "./font-loading";
import { FONT_CATALOG, catalogFont, effectiveFont, getFont, isDisplayFont, type FontEntry } from "./fonts";
import type { FontChoice, FontWeight, TypographySettings } from "./types";

/** The line shown in every pairing card. */
export const PAIRING_SAMPLE_LINE = "Stop shipping random blues and mismatched buttons.";
/** A short line for the mono accent in a pairing card. */
export const PAIRING_MONO_SAMPLE = "npm run build";

export interface FontPairing {
  id: string;
  name: string;
  /** One or two words describing the feel. */
  mood: string;
  /** One line on why the pair works. */
  reason: string;
  heading: string;
  body: string;
  /** Optional mono accent. */
  mono: string | null;
  headingWeight: FontWeight;
  bodyWeight: FontWeight;
  tracking: number;
}

export const FONT_PAIRINGS: FontPairing[] = [
  {
    id: "modern-saas",
    name: "Modern SaaS",
    mood: "Clear and neutral",
    reason: "One neutral family keeps every screen consistent, and weight alone carries the hierarchy.",
    heading: "Inter",
    body: "Inter",
    mono: null,
    headingWeight: 600,
    bodyWeight: 400,
    tracking: -0.02,
  },
  {
    id: "friendly-product",
    name: "Friendly product",
    mood: "Warm and approachable",
    reason: "Rounded geometric headings add personality while Inter keeps long text easy to read.",
    heading: "Plus Jakarta Sans",
    body: "Inter",
    mono: null,
    headingWeight: 700,
    bodyWeight: 400,
    tracking: -0.02,
  },
  {
    id: "developer-tools",
    name: "Developer tools",
    mood: "Technical and precise",
    reason: "One family throughout, plus a matching mono for code, IDs and numbers.",
    heading: "Geist",
    body: "Geist",
    mono: "Geist Mono",
    headingWeight: 600,
    bodyWeight: 400,
    tracking: -0.02,
  },
  {
    id: "editorial",
    name: "Editorial",
    mood: "Thoughtful and literary",
    reason: "A soft serif gives headlines a voice while a neutral sans keeps the interface quiet.",
    heading: "Fraunces",
    body: "Inter",
    mono: null,
    headingWeight: 600,
    bodyWeight: 400,
    tracking: -0.01,
  },
  {
    id: "sharp-technical",
    name: "Sharp and technical",
    mood: "Engineered and exact",
    reason: "A quirky grotesque for headings against a sturdy, technical body gives clear contrast.",
    heading: "Space Grotesk",
    body: "IBM Plex Sans",
    mono: null,
    headingWeight: 600,
    bodyWeight: 400,
    tracking: -0.02,
  },
  {
    id: "bold-startup",
    name: "Bold startup",
    mood: "Confident and energetic",
    reason: "A characterful display grotesque for headlines, a friendly geometric sans for reading.",
    heading: "Bricolage Grotesque",
    body: "DM Sans",
    mono: null,
    headingWeight: 700,
    bodyWeight: 400,
    tracking: -0.03,
  },
  {
    id: "classic-trust",
    name: "Classic trust",
    mood: "Established and dependable",
    reason: "A readable serif and a sans from the same design lineage feel steady and trustworthy.",
    heading: "Source Serif 4",
    body: "Source Sans 3",
    mono: null,
    headingWeight: 600,
    bodyWeight: 400,
    tracking: -0.01,
  },
  {
    id: "refined",
    name: "Refined",
    mood: "Elegant and calm",
    reason: "A condensed display serif paired with its own sans sibling for a quiet, premium feel.",
    heading: "Instrument Serif",
    body: "Instrument Sans",
    mono: null,
    headingWeight: 400,
    bodyWeight: 400,
    tracking: -0.01,
  },
];

/** The settings a pairing changes. */
export function pairingSettings(pairing: FontPairing): Pick<
  TypographySettings,
  "headingFont" | "bodyFont" | "monoFont" | "headingWeight" | "bodyWeight" | "headingTracking"
> {
  return {
    headingFont: catalogFont(pairing.heading),
    bodyFont: catalogFont(pairing.body),
    monoFont: pairing.mono ? catalogFont(pairing.mono) : null,
    headingWeight: pairing.headingWeight,
    bodyWeight: pairing.bodyWeight,
    headingTracking: pairing.tracking,
  };
}

const sameFont = (choice: FontChoice | null, name: string | null) =>
  choice === null ? name === null : choice.kind === "catalog" && choice.name === name;

/** Which pairing, if any, the current settings match exactly. */
export function matchingPairingId(t: TypographySettings): string | null {
  const match = FONT_PAIRINGS.find(
    (p) =>
      sameFont(t.headingFont, p.heading) &&
      sameFont(t.bodyFont, p.body) &&
      sameFont(t.monoFont, p.mono) &&
      t.headingWeight === p.headingWeight &&
      t.bodyWeight === p.bodyWeight &&
      t.headingTracking === p.tracking,
  );
  return match?.id ?? null;
}

export interface BodyRecommendation {
  font: FontEntry;
  reason: string;
}

/**
 * Three body font suggestions for a chosen heading font, from simple rules:
 *  - A serif heading gets a neutral sans body.
 *  - An expressive sans heading gets a workhorse sans body.
 *  - The same family is offered as the safe option, unless it is a display font.
 */
export function recommendBodyFonts(headingName: string): BodyRecommendation[] {
  const heading = getFont(headingName);
  if (!heading) return [];

  const usable = (font: FontEntry) => font.category === "sans" && !isDisplayFont(font) && font.name !== heading.name;
  const neutral = FONT_CATALOG.filter((f) => usable(f) && f.tags.includes("neutral") && f.tags.includes("workhorse"));
  const workhorse = FONT_CATALOG.filter((f) => usable(f) && f.tags.includes("workhorse"));

  const picks: BodyRecommendation[] = [];
  const add = (font: FontEntry | undefined, reason: string) => {
    if (font && !picks.some((pick) => pick.font.name === font.name)) picks.push({ font, reason });
  };

  const expressive = heading.tags.includes("expressive") || isDisplayFont(heading);
  if (heading.category === "serif") {
    add(neutral[0], "A neutral sans stays out of the way of a serif heading.");
    add(neutral[1], "A second neutral sans, a little warmer.");
  } else if (expressive) {
    add(workhorse[0], "A workhorse sans calms an expressive heading and reads well at small sizes.");
    add(workhorse[1], "A friendly workhorse with plenty of weights.");
  } else {
    add(neutral[0], "A neutral sans that lets the heading lead.");
    add(neutral[1], "A second neutral option with a slightly different feel.");
  }

  if (!expressive && heading.category !== "mono") {
    add(heading, "The same family as the heading. The safest choice.");
  }
  // Top up to three if a rule above produced fewer.
  for (const font of workhorse) {
    if (picks.length >= 3) break;
    add(font, "A reliable workhorse sans.");
  }
  return picks.slice(0, 3);
}

/** Plain-language cautions about the body font. Empty when it is a safe choice. */
export function bodyFontWarnings(body: FontChoice): string[] {
  const font = effectiveFont(body);
  const label = body.kind === "brand" ? `${body.name} (previewed with ${font.name})` : font.name;
  const warnings: string[] = [];
  if (isDisplayFont(font)) {
    warnings.push(`${label} is a display style made for big headlines. It gets tiring and hard to read at body sizes. Use it for headings and pick a plainer font for body text.`);
  }
  const missing: string[] = [];
  if (!font.weights.includes(400)) missing.push("regular (400)");
  if (!font.weights.includes(600)) missing.push("semibold (600)");
  if (missing.length) {
    warnings.push(`${label} does not offer ${missing.join(" and ")}. Body text and buttons need both, so the closest weight will be used instead.`);
  }
  return warnings;
}

/** The address for the pairing card fonts: only the fonts the cards use, only the sample text letters. */
export function pairingGalleryUrl(): string | null {
  const requests: FontRequest[] = FONT_PAIRINGS.flatMap((pairing) => [
    { name: pairing.heading, weights: [pairing.headingWeight] },
    { name: pairing.body, weights: [pairing.bodyWeight] },
    ...(pairing.mono ? [{ name: pairing.mono, weights: [400] }] : []),
  ]);
  return galleryFontsUrl(requests, PAIRING_SAMPLE_LINE + PAIRING_MONO_SAMPLE);
}
