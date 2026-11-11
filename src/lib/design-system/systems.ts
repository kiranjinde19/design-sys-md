/** The nine design systems shown as tiles in the tool, in board order. */

export type SystemId = "colors" | "typography" | "radius" | "spacing" | "borders" | "shadows" | "buttons" | "signature" | "voice";

export const SYSTEMS: { id: SystemId; label: string; description: string }[] = [
  { id: "colors", label: "Colors", description: "Brand color, scales and roles." },
  { id: "typography", label: "Typography", description: "Fonts, scale and line height." },
  { id: "radius", label: "Radius", description: "How round corners are." },
  { id: "spacing", label: "Spacing", description: "The spacing grid and density." },
  { id: "borders", label: "Borders", description: "Border width and color." },
  { id: "shadows", label: "Shadows", description: "Levels, intensity and style." },
  { id: "buttons", label: "Buttons and inputs", description: "Secondary style and states." },
  { id: "signature", label: "Signature details", description: "The small moves that make it yours." },
  { id: "voice", label: "Tone of voice", description: "How the words sound." },
];

export const isSystemId = (value: unknown): value is SystemId => SYSTEMS.some((system) => system.id === value);

/** Which tile a settings section belongs to. Icons and project facts have no tile. */
const SYSTEM_OF_SECTION: Record<string, SystemId> = {
  colors: "colors",
  typography: "typography",
  radius: "radius",
  spacing: "spacing",
  borders: "borders",
  elevation: "shadows",
  controls: "buttons",
  signature: "signature",
  voice: "voice",
};

/** The tiles a settings change touches. */
export function systemsInPatch(patch: Record<string, unknown>): SystemId[] {
  return Object.keys(patch).flatMap((section) => (SYSTEM_OF_SECTION[section] ? [SYSTEM_OF_SECTION[section]] : []));
}
