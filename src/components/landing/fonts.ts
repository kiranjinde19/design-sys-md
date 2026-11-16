import { Geist, Geist_Mono, IBM_Plex_Sans, Instrument_Sans, Newsreader } from "next/font/google";

/**
 * Landing page fonts, all through next/font (self hosted, no request to Google from the visitor's browser).
 * None of them is preloaded: Next merges the preload lists of every page of the app, so a preloaded landing font would
 * also be downloaded (unused) by the tool, and the other way round. Each file loads when its text is drawn.
 */
const page = Instrument_Sans({ subsets: ["latin"], variable: "--f-page", display: "swap", preload: false });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--f-mono", display: "swap", preload: false });
const geist = Geist({ subsets: ["latin"], variable: "--f-geist", display: "swap", preload: false });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--f-newsreader", display: "swap", preload: false });
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-plex", display: "swap", preload: false });

export const fontClasses = [page, mono, geist, newsreader, plex].map((font) => font.variable).join(" ");
