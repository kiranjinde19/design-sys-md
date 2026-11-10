import { useEffect } from "react";
import {
  SYSTEM_STACKS,
  fontNamesUrl,
  getFont,
  pairingGalleryUrl,
  selectedFontsUrl,
  useDesignSystem,
} from "@/lib/design-system";

/**
 * Browser-side font loading. The addresses come from the design system (font-loading.ts).
 * Nothing here loads the full font list.
 *
 * Fonts used only for tiny previews (names in the picker, the pairing cards) are loaded
 * under a different internal name than the real font. Without that, a small name-only
 * file and the full font would share one name, and the browser could pick the small one
 * and drop letters from your real preview.
 */

const NAME_PREFIX = "ds-name-";
const GALLERY_PREFIX = "ds-gallery-";

/** The font-family value for a name rendered with the picker's tiny name-only font. */
export const nameFamily = (name: string) =>
  `'${NAME_PREFIX}${name}', ${SYSTEM_STACKS[getFont(name)?.category ?? "sans"]}`;

/** The font-family value for a pairing card sample. */
export const galleryFamily = (name: string) =>
  `'${GALLERY_PREFIX}${name}', ${SYSTEM_STACKS[getFont(name)?.category ?? "sans"]}`;

function ensurePreconnect() {
  for (const [id, href, cross] of [
    ["ds-preconnect-css", "https://fonts.googleapis.com", false],
    ["ds-preconnect-files", "https://fonts.gstatic.com", true],
  ] as const) {
    if (document.getElementById(id)) continue;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "preconnect";
    link.href = href;
    if (cross) link.crossOrigin = "";
    document.head.appendChild(link);
  }
}

/** Adds, updates or removes one stylesheet link. */
function applyStylesheet(id: string, href: string | null) {
  let link = document.getElementById(id) as HTMLLinkElement | null;
  if (!href) {
    link?.remove();
    return;
  }
  ensurePreconnect();
  if (!link) {
    link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.getAttribute("href") !== href) link.setAttribute("href", href);
}

const loadedSubsets = new Set<string>();

/** Fetches a Google Fonts stylesheet, renames its families with a prefix, and adds it to the page. */
async function loadSubsetStyle(id: string, url: string, prefix: string) {
  if (loadedSubsets.has(id + url)) return;
  loadedSubsets.add(id + url);
  try {
    ensurePreconnect();
    const response = await fetch(url);
    if (!response.ok) return;
    const css = (await response.text()).replace(/font-family:\s*'([^']+)'/g, `font-family: '${prefix}$1'`);
    let style = document.getElementById(id) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = id;
      document.head.appendChild(style);
    }
    style.textContent = css;
  } catch {
    // Offline or blocked: previews fall back to system fonts and nothing breaks.
    loadedSubsets.delete(id + url);
  }
}

/** Loads only the fonts currently selected (heading, body, mono), in the weights they offer. */
export function useSelectedFonts() {
  const { tokens } = useDesignSystem();
  const url = selectedFontsUrl(tokens.typography);
  useEffect(() => {
    applyStylesheet("ds-selected-fonts", url);
  }, [url]);
}

/** Loads the pairing card fonts as a tiny subset holding only the sample text letters. */
export function useGalleryFonts() {
  useEffect(() => {
    const url = pairingGalleryUrl();
    if (url) void loadSubsetStyle("ds-gallery-fonts", url, GALLERY_PREFIX);
  }, []);
}

/** Loads the picker's name previews: one request holding only the letters the names need. */
export function useFontNames() {
  useEffect(() => {
    const url = fontNamesUrl();
    if (url) void loadSubsetStyle("ds-font-names", url, NAME_PREFIX);
  }, []);
}
