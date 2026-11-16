/** Plain constants for the demo. No engine code in here, so client components can import it without loading the engine. */

export const DEMO_COLORS = [
  { name: "Cobalt", hex: "#3B5BDB" },
  { name: "Saffron", hex: "#F2B705" },
  { name: "Forest", hex: "#0F8A5F" },
  { name: "Rose", hex: "#D6336C" },
  { name: "Ink", hex: "#1F2328" },
  { name: "Brick", hex: "#C2410C" },
] as const;

/** The three demo type choices: heading font and body font, both from the app's font catalog. */
export const DEMO_FONTS = [
  { label: "Clean", heading: "Geist", body: "Geist" },
  { label: "Editorial", heading: "Newsreader", body: "Geist" },
  { label: "Technical", heading: "IBM Plex Sans", body: "IBM Plex Sans" },
] as const;

export interface DemoInput {
  brand: string;
  /** Corners slider, 0 to 20. */
  radius: number;
  /** Index into DEMO_FONTS. */
  font: number;
}

export const DEMO_DEFAULT: DemoInput = { brand: DEMO_COLORS[0].hex, radius: 0, font: 0 };

