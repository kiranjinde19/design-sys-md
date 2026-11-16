import { useEffect } from "react";
import {
  FONT_GALLERY_STYLESHEET,
  FONT_NAMES_STYLESHEET,
  SYSTEM_STACKS,
  getFont,
  selectedFontStylesheets,
  useDesignSystem,
} from "@/lib/design-system";

/**
 * Browser side font loading, from this site's own files (public/fonts). Nothing here asks a third party for anything, and
 * nothing loads the full list: a font's file is requested only when text in that font is drawn.
 *
 *  - The fonts in use (heading, body, mono) get their small stylesheet.
 *  - The font picker adds the name previews: one stylesheet, tiny files holding only the letters of the names.
 *  - The pairing gallery adds the sample line previews, the same way.
 *
 * Preview-only subsets are loaded under a different internal name than the real font (ds-name-*, ds-gallery-*). Without
 * that, a small name-only file and the full font would share one name, and the browser could pick the small one and
 * drop letters from your real preview.
 */

const NAME_PREFIX = "ds-name-";
const GALLERY_PREFIX = "ds-gallery-";

/** The font-family value for a name rendered with the picker's tiny name-only font. */
export const nameFamily = (name: string) =>
  `'${NAME_PREFIX}${name}', ${SYSTEM_STACKS[getFont(name)?.category ?? "sans"]}`;

/** The font-family value for a pairing card sample. */
export const galleryFamily = (name: string) =>
  `'${GALLERY_PREFIX}${name}', ${SYSTEM_STACKS[getFont(name)?.category ?? "sans"]}`;

/** Makes sure a stylesheet link with this id points at `href` (adds it, updates it, or removes it when href is null). */
function applyStylesheet(id: string, href: string | null) {
  let link = document.getElementById(id) as HTMLLinkElement | null;
  if (!href) {
    link?.remove();
    return;
  }
  // The tool's own text already loads Inter's stylesheet in the page head: no second link for the same file.
  if (!link && document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return;
  if (!link) {
    link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.getAttribute("href") !== href) link.setAttribute("href", href);
}

const SELECTED_PREFIX = "ds-font-";

/** Loads the stylesheets of the fonts currently selected (heading, body, mono) and drops the ones no longer in use. */
export function useSelectedFonts() {
  const { tokens } = useDesignSystem();
  const hrefs = selectedFontStylesheets(tokens.typography);
  const key = hrefs.join("|");
  useEffect(() => {
    const wanted = new Set(key ? key.split("|") : []);
    document.querySelectorAll<HTMLLinkElement>(`link[id^="${SELECTED_PREFIX}"]`).forEach((link) => {
      if (!wanted.has(link.getAttribute("href") ?? "")) link.remove();
    });
    wanted.forEach((href) => applyStylesheet(`${SELECTED_PREFIX}${href}`, href));
  }, [key]);
}

/** Loads the pairing card fonts: tiny subsets holding only the sample line letters. */
export function useGalleryFonts() {
  useEffect(() => {
    applyStylesheet("ds-gallery-fonts", FONT_GALLERY_STYLESHEET);
  }, []);
}

/** Loads the picker's name previews: tiny subsets holding only the letters the names need. */
export function useFontNames() {
  useEffect(() => {
    applyStylesheet("ds-font-names", FONT_NAMES_STYLESHEET);
  }, []);
}
