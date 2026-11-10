import { SETTINGS_SCHEMA_VERSION, type DesignSystemSettings } from "../types";
import { fence, lines } from "./context";

export const DATA_FORMAT = "design-sys-md";

/** The block at the end of the file. It holds the settings, so importing the file restores everything. */
export function dataBlock(settings: DesignSystemSettings): string[] {
  return lines(
    "## Design system data",
    "",
    "Written by Design Sys.md. Do not edit by hand. It lets the tool restore this design system. Tokens above are generated from it.",
    "",
    fence("json", JSON.stringify({ format: DATA_FORMAT, version: SETTINGS_SCHEMA_VERSION, settings })),
  );
}

export type ParseResult = { ok: true; settings: unknown } | { ok: false; error: string };

/** Reads the data block from a previously exported file. Uses the last matching JSON block. */
export function parseSkillFile(text: string): ParseResult {
  const blocks = [...text.matchAll(/```json\s*\n([\s\S]*?)\n```/g)].map((m) => m[1]);
  for (const body of blocks.reverse()) {
    try {
      const parsed = JSON.parse(body) as { format?: unknown; settings?: unknown };
      if (parsed && parsed.format === DATA_FORMAT && typeof parsed.settings === "object" && parsed.settings !== null) {
        return { ok: true, settings: parsed.settings };
      }
    } catch {
      // Not our block. Keep looking.
    }
  }
  return { ok: false, error: "This file has no Design Sys.md data block. Use a file that was exported from this tool." };
}
