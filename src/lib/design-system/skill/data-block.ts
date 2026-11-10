import { normalizeSettings } from "../normalize";
import { DEFAULT_PRESET_ID, PRESETS, isPresetId, type PresetId } from "../presets";
import { SETTINGS_SCHEMA_VERSION, type DesignSystemSettings } from "../types";
import { fence, lines } from "./context";

export const DATA_FORMAT = "design-sys-md";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const isObject = (value: unknown): value is Record<string, Json> => typeof value === "object" && value !== null && !Array.isArray(value);

/** Only what differs from the base. Anything equal to the base is left out, to keep the block small. */
function diff(base: Json, current: Json): Json | undefined {
  if (isObject(base) && isObject(current)) {
    const out: Record<string, Json> = {};
    for (const key of Object.keys(current)) {
      const d = diff(base[key] ?? null, current[key]);
      if (d !== undefined) out[key] = d;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return JSON.stringify(base) === JSON.stringify(current) ? undefined : current;
}

/**
 * The block at the end of the file. It holds the starting preset and the settings that differ from it,
 * so importing the file restores everything. Tokens above it are generated from these settings.
 */
export function dataBlock(settings: DesignSystemSettings, presetId: PresetId): string[] {
  const changes = diff(PRESETS[presetId].settings as unknown as Json, settings as unknown as Json) ?? {};
  return lines(
    "## Design system data",
    "",
    "Written by Design Sys.md. Do not edit by hand. The tool reads it to restore this design system.",
    "",
    fence("json", JSON.stringify({ format: DATA_FORMAT, version: SETTINGS_SCHEMA_VERSION, preset: presetId, settings: changes })),
  );
}

export type ParseResult = { ok: true; presetId: PresetId; settings: DesignSystemSettings } | { ok: false; error: string };

/**
 * Reads the data block from an exported file and rebuilds the full settings. Uses the last matching
 * JSON block. Older files that hold complete settings and no preset still load.
 */
export function parseSkillFile(text: string): ParseResult {
  const blocks = [...text.matchAll(/```json\s*\n([\s\S]*?)\n```/g)].map((m) => m[1]);
  for (const body of blocks.reverse()) {
    try {
      const parsed = JSON.parse(body) as { format?: unknown; preset?: unknown; settings?: unknown };
      if (parsed && parsed.format === DATA_FORMAT && typeof parsed.settings === "object" && parsed.settings !== null) {
        const presetId = isPresetId(parsed.preset) ? parsed.preset : DEFAULT_PRESET_ID;
        return { ok: true, presetId, settings: normalizeSettings(parsed.settings, PRESETS[presetId].settings) };
      }
    } catch {
      // Not our block. Keep looking.
    }
  }
  return { ok: false, error: "This file has no Design Sys.md data block. Use a file that was exported from this tool." };
}
