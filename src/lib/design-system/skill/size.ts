/**
 * The Export step's size meter and "What is inside" chips. Pure functions, so the screen and the tests share them.
 * Codex stops reading instruction files at 32 KiB by default (`project_doc_max_bytes`).
 */

export const CODEX_LIMIT_BYTES = 32 * 1024;
/** From this size a gentle note appears. */
export const CODEX_NEAR_BYTES = 30 * 1024;

/** "fits" below 30 KiB, "near" from 30 KiB up to and including 32 KiB, "over" above 32 KiB. */
export type SizeState = "fits" | "near" | "over";

export const sizeState = (bytes: number): SizeState => (bytes > CODEX_LIMIT_BYTES ? "over" : bytes >= CODEX_NEAR_BYTES ? "near" : "fits");

export const kib = (bytes: number): string => (bytes / 1024).toFixed(1);

const FRIENDLY: Record<string, string> = {
  "Hard rules": "Hard rules",
  Tokens: "Tokens",
  Components: "Component recipes",
  "Layout and navigation": "Layout",
  "Overlays and feedback": "Overlays",
  Icons: "Icons",
  "Signature details": "Signature details",
  "Tone of voice": "Tone of voice",
  Accessibility: "Accessibility",
  "Do and don't": "Do and don't",
  "Final checklist": "Final checklist",
  "Design system data": "Data block",
};

/** The sections that are really in the file, in order. "Custom roles" is added only when the file lists custom roles. */
export function fileSections(text: string): string[] {
  const sections = [...text.matchAll(/^## (.+)$/gm)].map((match) => FRIENDLY[match[1].trim()] ?? match[1].trim());
  const out = [...new Set(sections)];
  if (/^Custom roles \(never change them\):/m.test(text)) {
    const at = out.indexOf("Tokens");
    out.splice(at === -1 ? out.length : at + 1, 0, "Custom roles");
  }
  return out;
}
