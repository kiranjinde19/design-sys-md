/**
 * Frozen copies of every released version of each preset.
 *
 * Exported files store only what differs from a preset, plus the preset version. To restore an old
 * file exactly, the preset as it was at that version is needed, so it lives here and never changes.
 *
 * WHEN YOU CHANGE A PRESET (a value, or a new setting added to the schema):
 *   1. Bump its version in presets.ts.
 *   2. Add the NEW version's JSON below, and leave every old entry exactly as it is.
 * A guard fails the build if a preset differs from its snapshot, so this can not be forgotten.
 */

import { PRESETS, type PresetId } from "./presets";
import type { DesignSystemSettings } from "./types";

export const PRESET_SNAPSHOTS: Record<PresetId, Record<number, string>> = {
  "saas-clean": {
    1: "{\"schemaVersion\":1,\"colors\":{\"brand\":\"#4F46E5\",\"secondary\":null,\"neutralTone\":\"cool\",\"roles\":{\"background\":{\"scale\":\"white\"},\"foreground\":{\"scale\":\"neutral\",\"step\":900},\"card\":{\"scale\":\"white\"},\"primary\":{\"scale\":\"brand\",\"step\":600},\"muted\":{\"scale\":\"neutral\",\"step\":100},\"muted-foreground\":{\"scale\":\"neutral\",\"step\":600},\"destructive\":{\"scale\":\"error\",\"step\":600},\"border\":{\"scale\":\"neutral\",\"step\":200},\"ring\":{\"scale\":\"brand\",\"step\":500}}},\"typography\":{\"headingFont\":{\"kind\":\"catalog\",\"name\":\"Inter\"},\"bodyFont\":{\"kind\":\"catalog\",\"name\":\"Inter\"},\"monoFont\":null,\"headingTracking\":-0.02,\"baseSize\":16,\"scaleRatio\":1.2,\"lineHeight\":1.5,\"headingWeight\":600,\"bodyWeight\":400},\"icons\":{\"style\":\"outline\",\"strokeWidth\":1.5,\"ends\":\"round\"},\"radius\":{\"base\":10},\"spacing\":{\"base\":4,\"density\":\"comfortable\"},\"borders\":{\"width\":1,\"colorStep\":200},\"elevation\":{\"levels\":5,\"intensity\":50,\"style\":\"soft\"},\"controls\":{\"secondaryStyle\":\"fill\",\"height\":40},\"signature\":{\"featuredHighlight\":\"glow-border\",\"cardStyle\":\"tinted-bento-tile\",\"hover\":\"lift-2px\",\"primaryCta\":\"animated-glow-border\",\"iconContainer\":\"rounded-square-tile\",\"focusRing\":\"offset-ring\",\"divider\":\"hairline\"},\"voice\":{\"formality\":4,\"energy\":2,\"detail\":2},\"project\":{\"name\":\"\",\"description\":\"\",\"stack\":\"next-tailwind-shadcn\"}}",
    2: "{\"schemaVersion\":1,\"colors\":{\"brand\":\"#4F46E5\",\"secondary\":null,\"neutralTone\":\"cool\",\"roles\":{\"background\":{\"scale\":\"white\"},\"foreground\":{\"scale\":\"neutral\",\"step\":900},\"card\":{\"scale\":\"white\"},\"primary\":{\"scale\":\"brand\",\"step\":600},\"muted\":{\"scale\":\"neutral\",\"step\":100},\"muted-foreground\":{\"scale\":\"neutral\",\"step\":600},\"destructive\":{\"scale\":\"error\",\"step\":600},\"border\":{\"scale\":\"neutral\",\"step\":200},\"ring\":{\"scale\":\"brand\",\"step\":500}}},\"typography\":{\"headingFont\":{\"kind\":\"catalog\",\"name\":\"Inter\"},\"bodyFont\":{\"kind\":\"catalog\",\"name\":\"Inter\"},\"monoFont\":null,\"headingTracking\":-0.02,\"baseSize\":16,\"scaleRatio\":1.2,\"lineHeight\":1.5,\"headingWeight\":600,\"bodyWeight\":400},\"icons\":{\"style\":\"outline\",\"strokeWidth\":1.5,\"ends\":\"round\"},\"radius\":{\"base\":10},\"spacing\":{\"base\":4,\"density\":\"comfortable\"},\"borders\":{\"width\":1,\"colorStep\":200},\"elevation\":{\"levels\":5,\"intensity\":50,\"style\":\"soft\"},\"controls\":{\"secondaryStyle\":\"fill\",\"height\":40},\"signature\":{\"featuredHighlight\":\"glow-border\",\"cardStyle\":\"tinted-bento-tile\",\"hover\":\"lift-2px\",\"primaryCta\":\"border-beam\",\"iconContainer\":\"rounded-square-tile\",\"focusRing\":\"offset-ring\",\"divider\":\"hairline\"},\"voice\":{\"formality\":4,\"energy\":2,\"detail\":2},\"project\":{\"name\":\"\",\"description\":\"\",\"stack\":\"next-tailwind-shadcn\"}}",
    3: "{\"schemaVersion\":1,\"colors\":{\"brand\":\"#4F46E5\",\"secondary\":null,\"neutralTone\":\"cool\",\"roles\":{\"background\":{\"scale\":\"white\"},\"foreground\":{\"scale\":\"neutral\",\"step\":900},\"card\":{\"scale\":\"white\"},\"primary\":{\"scale\":\"brand\",\"step\":600},\"muted\":{\"scale\":\"neutral\",\"step\":100},\"muted-foreground\":{\"scale\":\"neutral\",\"step\":600},\"destructive\":{\"scale\":\"error\",\"step\":600},\"border\":{\"scale\":\"neutral\",\"step\":200},\"ring\":{\"scale\":\"brand\",\"step\":500}}},\"typography\":{\"headingFont\":{\"kind\":\"catalog\",\"name\":\"Inter\"},\"bodyFont\":{\"kind\":\"catalog\",\"name\":\"Inter\"},\"monoFont\":null,\"headingTracking\":-0.02,\"baseSize\":16,\"scaleRatio\":1.2,\"lineHeight\":1.5,\"headingWeight\":600,\"bodyWeight\":400},\"icons\":{\"style\":\"outline\",\"strokeWidth\":1.5,\"ends\":\"round\"},\"radius\":{\"base\":10},\"spacing\":{\"base\":4,\"density\":\"comfortable\"},\"borders\":{\"width\":1,\"colorStep\":200},\"elevation\":{\"levels\":5,\"intensity\":50,\"style\":\"soft\"},\"controls\":{\"secondaryStyle\":\"fill\",\"height\":40},\"signature\":{\"featuredHighlight\":\"crisp-border\",\"cardStyle\":\"tinted-bento-tile\",\"hover\":\"lift-2px\",\"primaryCta\":\"border-beam\",\"iconContainer\":\"rounded-square-tile\",\"focusRing\":\"offset-ring\",\"divider\":\"hairline\"},\"voice\":{\"formality\":4,\"energy\":2,\"detail\":2},\"project\":{\"name\":\"\",\"description\":\"\",\"stack\":\"next-tailwind-shadcn\"}}",
  },
  "blank-slate": {
    1: "{\"schemaVersion\":1,\"colors\":{\"brand\":\"#404040\",\"secondary\":null,\"neutralTone\":\"pure\",\"roles\":{\"background\":{\"scale\":\"white\"},\"foreground\":{\"scale\":\"neutral\",\"step\":900},\"card\":{\"scale\":\"white\"},\"primary\":{\"scale\":\"brand\",\"step\":600},\"muted\":{\"scale\":\"neutral\",\"step\":100},\"muted-foreground\":{\"scale\":\"neutral\",\"step\":600},\"destructive\":{\"scale\":\"error\",\"step\":600},\"border\":{\"scale\":\"neutral\",\"step\":200},\"ring\":{\"scale\":\"brand\",\"step\":500}}},\"typography\":{\"headingFont\":{\"kind\":\"catalog\",\"name\":\"Inter\"},\"bodyFont\":{\"kind\":\"catalog\",\"name\":\"Inter\"},\"monoFont\":null,\"headingTracking\":-0.02,\"baseSize\":16,\"scaleRatio\":1.25,\"lineHeight\":1.5,\"headingWeight\":600,\"bodyWeight\":400},\"icons\":{\"style\":\"outline\",\"strokeWidth\":1.5,\"ends\":\"round\"},\"radius\":{\"base\":6},\"spacing\":{\"base\":4,\"density\":\"comfortable\"},\"borders\":{\"width\":1,\"colorStep\":200},\"elevation\":{\"levels\":3,\"intensity\":30,\"style\":\"soft\"},\"controls\":{\"secondaryStyle\":\"fill\",\"height\":40},\"signature\":{\"featuredHighlight\":\"solid-accent-fill\",\"cardStyle\":\"hairline-border\",\"hover\":\"border-color-shift\",\"primaryCta\":\"solid\",\"iconContainer\":\"bare\",\"focusRing\":\"offset-ring\",\"divider\":\"hairline\"},\"voice\":{\"formality\":3,\"energy\":3,\"detail\":3},\"project\":{\"name\":\"\",\"description\":\"\",\"stack\":\"next-tailwind-shadcn\"}}",
  },
};

type Plain = { [key: string]: unknown };
const isPlain = (v: unknown): v is Plain => typeof v === "object" && v !== null && !Array.isArray(v);

/** Fills anything missing from an old snapshot (a setting added later) with the current preset's value. */
function fillMissing(old: unknown, current: unknown): unknown {
  if (!isPlain(old) || !isPlain(current)) return old === undefined ? current : old;
  const out: Plain = { ...old };
  for (const key of Object.keys(current)) out[key] = key in old ? fillMissing(old[key], current[key]) : current[key];
  return out;
}

/** The settings of a preset as they were at a given version, or null if that version does not exist. */
export function presetBase(id: PresetId, version: number): DesignSystemSettings | null {
  if (version === PRESETS[id].version) return PRESETS[id].settings;
  const snapshot = PRESET_SNAPSHOTS[id]?.[version];
  if (!snapshot) return null;
  return fillMissing(JSON.parse(snapshot), PRESETS[id].settings) as DesignSystemSettings;
}

/** Fails loudly if a preset was edited without a version bump and a new snapshot. */
export function assertPresetsMatchSnapshots() {
  for (const id of Object.keys(PRESETS) as PresetId[]) {
    const { version, settings } = PRESETS[id];
    const snapshot = PRESET_SNAPSHOTS[id]?.[version];
    if (snapshot === undefined) throw new Error(`Preset "${id}" is at version ${version} but has no snapshot in preset-history.ts. Add one.`);
    if (JSON.stringify(settings) !== snapshot) {
      throw new Error(`Preset "${id}" changed without a version bump. Bump its version in presets.ts and add the new snapshot to preset-history.ts. Old exported files depend on the old snapshot staying as it is.`);
    }
  }
}

assertPresetsMatchSnapshots();
