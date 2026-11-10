/** The two starting points: "SaaS Clean" and "Blank slate". */

import { catalogFont } from "./fonts";
import { BLANK_SLATE_SIGNATURE, SAAS_CLEAN_SIGNATURE } from "./signature";
import {
  SETTINGS_SCHEMA_VERSION,
  type ColorRef,
  type DesignSystemSettings,
  type ProjectSettings,
  type ScaleStep,
} from "./types";

export const PRESET_IDS = ["saas-clean", "blank-slate"] as const;
export type PresetId = (typeof PRESET_IDS)[number];

export interface Preset {
  id: PresetId;
  /** Bump this whenever the preset changes, and add a snapshot in preset-history.ts. */
  version: number;
  name: string;
  description: string;
  settings: DesignSystemSettings;
}

const ref = (scale: "brand" | "neutral" | "error", step: ScaleStep): ColorRef => ({
  scale,
  step,
});

const DEFAULT_ROLES = {
  background: { scale: "white" } as ColorRef,
  foreground: ref("neutral", 900),
  card: { scale: "white" } as ColorRef,
  primary: ref("brand", 600),
  muted: ref("neutral", 100),
  "muted-foreground": ref("neutral", 600),
  destructive: ref("error", 600),
  border: ref("neutral", 200),
  ring: ref("brand", 500),
};

const DEFAULT_PROJECT: ProjectSettings = { name: "", description: "", stack: "next-tailwind-shadcn" };

const SAAS_CLEAN: DesignSystemSettings = {
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  colors: { brand: "#4F46E5", secondary: null, neutralTone: "cool", roles: DEFAULT_ROLES },
  typography: {
    headingFont: catalogFont("Inter"),
    bodyFont: catalogFont("Inter"),
    monoFont: null,
    headingTracking: -0.02,
    baseSize: 16,
    scaleRatio: 1.2,
    lineHeight: 1.5,
    headingWeight: 600,
    bodyWeight: 400,
  },
  icons: { style: "outline", strokeWidth: 1.5, ends: "round" },
  radius: { base: 10 },
  spacing: { base: 4, density: "comfortable" },
  borders: { width: 1, colorStep: 200 },
  elevation: { levels: 5, intensity: 50, style: "soft" },
  controls: { secondaryStyle: "fill", height: 40 },
  signature: SAAS_CLEAN_SIGNATURE,
  // Casual, calm, concise.
  voice: { formality: 4, energy: 2, detail: 2 },
  project: DEFAULT_PROJECT,
};

const BLANK_SLATE: DesignSystemSettings = {
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  colors: { brand: "#404040", secondary: null, neutralTone: "pure", roles: DEFAULT_ROLES },
  typography: {
    headingFont: catalogFont("Inter"),
    bodyFont: catalogFont("Inter"),
    monoFont: null,
    headingTracking: -0.02,
    baseSize: 16,
    scaleRatio: 1.25,
    lineHeight: 1.5,
    headingWeight: 600,
    bodyWeight: 400,
  },
  icons: { style: "outline", strokeWidth: 1.5, ends: "round" },
  radius: { base: 6 },
  spacing: { base: 4, density: "comfortable" },
  borders: { width: 1, colorStep: 200 },
  elevation: { levels: 3, intensity: 30, style: "soft" },
  controls: { secondaryStyle: "fill", height: 40 },
  signature: BLANK_SLATE_SIGNATURE,
  voice: { formality: 3, energy: 3, detail: 3 },
  project: DEFAULT_PROJECT,
};

export const PRESETS: Record<PresetId, Preset> = {
  "saas-clean": {
    id: "saas-clean",
    version: 1,
    name: "SaaS Clean",
    description: "Indigo brand, cool grays, soft shadows and a few signature moves.",
    settings: SAAS_CLEAN,
  },
  "blank-slate": {
    id: "blank-slate",
    version: 1,
    name: "Blank slate",
    description: "Neutral and quiet. A plain starting point with nothing decided for you.",
    settings: BLANK_SLATE,
  },
};

export const DEFAULT_PRESET_ID: PresetId = "saas-clean";

export function isPresetId(value: unknown): value is PresetId {
  return typeof value === "string" && (PRESET_IDS as readonly string[]).includes(value);
}
