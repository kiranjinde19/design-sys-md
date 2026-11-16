/**
 * Where the tool's own copies of the catalog fonts live (public/fonts, made by scripts/fetch-fonts.mjs). The tool previews
 * fonts from these files, so a visitor's browser never asks a third party for them. Pure functions, no browser code.
 *
 * This is only about the tool. The skill file that Plinth writes still tells the user's own project to load its fonts from
 * Google (see font-loading.ts), because that is the user's project and not this site.
 */

import { getFont } from "./fonts";
import type { FontToken } from "./types";

export const slugOfFont = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** The stylesheet for one catalog font (its faces point to files that load only when the font is used), or null for any other name. */
export function fontStylesheet(name: string): string | null {
  return getFont(name) ? `/fonts/css/${slugOfFont(name)}.css` : null;
}

/** The picker's name previews: tiny files holding only the letters of the font names. */
export const FONT_NAMES_STYLESHEET = "/fonts/css/names.css";
/** The pairing cards: tiny files holding only the letters of the sample lines. */
export const FONT_GALLERY_STYLESHEET = "/fonts/css/gallery.css";

/** The stylesheets for the fonts in use right now. Brand fonts use their fallback, which is what previews show. */
export function selectedFontStylesheets(fonts: { heading: FontToken; body: FontToken; mono: FontToken | null }): string[] {
  const names = [fonts.heading, fonts.body, fonts.mono].filter((font): font is FontToken => font !== null).map((font) => font.fallbackName ?? font.name);
  return [...new Set(names.map(fontStylesheet).filter((href): href is string => href !== null))];
}
