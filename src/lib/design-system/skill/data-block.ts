import { legacyChoiceNotices, normalizeSettings } from "../normalize";
import { presetBase } from "../preset-history";
import { DEFAULT_PRESET_ID, PRESETS, isPresetId, type PresetId } from "../presets";
import { type DesignSystemSettings } from "../types";
import { fence, lines } from "./context";

export const DATA_FORMAT = "design-sys-md";

/**
 * The version of the data block itself. Version 2 added the brand color mode (exact or adjusted) next to the typed
 * color. Files with version 1 (or none) still import: the mode defaults to exact.
 */
export const DATA_FORMAT_VERSION = 2;

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
 * The block at the end of the file. It holds the starting preset, the preset VERSION, and the settings
 * that differ from it. Importing rebuilds the settings from that exact version of the preset, so an old
 * file never changes when a preset is later updated. Tokens above are generated from these settings.
 */
export function dataBlock(settings: DesignSystemSettings, presetId: PresetId): string[] {
  const changes = diff(PRESETS[presetId].settings as unknown as Json, settings as unknown as Json) ?? {};
  const presetVersion = PRESETS[presetId].version;
  return lines(
    "## Design system data",
    "",
    "Written by Design Sys.md. Do not edit by hand. The tool reads it to restore this design system.",
    "",
    fence("json", JSON.stringify({ format: DATA_FORMAT, version: DATA_FORMAT_VERSION, preset: presetId, presetVersion, settings: changes })),
  );
}

export type ParseResult =
  | {
      ok: true;
      presetId: PresetId;
      settings: DesignSystemSettings;
      /** How many individual values differ from the starting preset, for the success message. */
      changes: number;
      /** Things changed silently on import, for the success message (for example the old glow replaced). */
      notices: string[];
    }
  | { ok: false; error: string };

/** Counts the individual values in a "differences only" object. */
function countChanges(value: unknown): number {
  if (isObject(value as Json)) return Object.values(value as Record<string, unknown>).reduce<number>((sum, inner) => sum + countChanges(inner), 0);
  return 1;
}

/**
 * Reads the data block from an exported file and rebuilds the full settings. Uses the last block that
 * belongs to Design Sys.md. Older files that hold complete settings and no preset still load. Every
 * failure says why, so the screen can show it.
 */
export function parseSkillFile(text: string): ParseResult {
  const blocks = [...text.matchAll(/```json\s*\n([\s\S]*?)\n```/g)].map((m) => m[1]);
  if (blocks.length === 0) {
    return { ok: false, error: "No data block found. This file has no JSON block at the end, so it was not exported from Design Sys.md (or the block was deleted)." };
  }
  let invalid = false;
  for (const body of blocks.reverse()) {
    let parsed: { format?: unknown; version?: unknown; preset?: unknown; presetVersion?: unknown; settings?: unknown };
    try {
      parsed = JSON.parse(body);
    } catch {
      // A broken block that looks like ours is worth a clear message. Others are just not ours.
      if (body.includes(DATA_FORMAT)) invalid = true;
      continue;
    }
    if (!parsed || parsed.format !== DATA_FORMAT) continue;
    if (typeof parsed.settings !== "object" || parsed.settings === null) {
      return { ok: false, error: "The data block has no settings. It looks damaged, so export the file again." };
    }
    if (typeof parsed.version === "number" && parsed.version > DATA_FORMAT_VERSION) {
      return { ok: false, error: `Unsupported version: this file uses data format ${parsed.version}, and this tool reads up to ${DATA_FORMAT_VERSION}. Update the tool, then import it again.` };
    }
    const presetId = isPresetId(parsed.preset) ? parsed.preset : DEFAULT_PRESET_ID;
    // Files made before the version was stored are version 1.
    const version = typeof parsed.presetVersion === "number" ? parsed.presetVersion : 1;
    const preset = presetBase(presetId, version);
    if (!preset) {
      return { ok: false, error: `Unsupported version: this file was made from ${PRESETS[presetId].name} version ${version}, which this tool does not know. Update the tool, then import it again.` };
    }
    return { ok: true, presetId, settings: normalizeSettings(parsed.settings, preset), changes: countChanges(parsed.settings), notices: legacyChoiceNotices(parsed.settings, preset) };
  }
  return {
    ok: false,
    error: invalid
      ? "Invalid JSON: the Design Sys.md data block at the end of the file is damaged (a comma, quote or bracket is missing). Export the file again, or restore it from the original."
      : "No data block found. The file has JSON, but none of it is a Design Sys.md data block.",
  };
}
