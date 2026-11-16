import { Geist, Geist_Mono, IBM_Plex_Sans, Instrument_Sans, Newsreader } from "next/font/google";

/**
 * Landing page fonts, all through next/font (self hosted, no request to Google from the visitor's browser).
 * The page font, the code font and the default demo font (Geist) are preloaded because they are on screen at once.
 * The two other demo fonts load only when the visitor picks them.
 */
const page = Instrument_Sans({ subsets: ["latin"], variable: "--f-page", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--f-mono", display: "swap" });
const geist = Geist({ subsets: ["latin"], variable: "--f-geist", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--f-newsreader", display: "swap", preload: false });
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-plex", display: "swap", preload: false });

export const fontClasses = [page, mono, geist, newsreader, plex].map((font) => font.variable).join(" ");
