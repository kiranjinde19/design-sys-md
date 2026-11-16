/**
 * Prints the generated skill file as plain text, for reviewing what an AI tool will read (this replaces the old /debug/skill
 * pages, which are no longer part of the app).
 *
 *   node scripts/print-skill.mjs [next-tailwind-shadcn | react-tailwind | html-css] [skill | agents]
 *
 * It prints the SaaS Clean preset with a sample product name, a description and a secondary color, which is the size the
 * size rule in CLAUDE.md is measured on. The size and line count go to stderr.
 */

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const stack = process.argv[2] ?? "next-tailwind-shadcn";
const which = process.argv[3] === "agents" ? "agents" : "skill";
const lib = "src/lib/design-system";
const out = mkdtempSync(join(tmpdir(), "dsmd-print-"));
try {
  execFileSync("npx", ["tsc", ...["generate", "presets", "normalize", "skill/generate"].map((f) => `${lib}/${f}.ts`), "--outDir", out, "--module", "commonjs", "--moduleResolution", "node", "--target", "es2020", "--skipLibCheck"], { stdio: "pipe" });
} catch {
  // tsc exits non-zero on type errors but still writes files.
}
const require = createRequire(import.meta.url);
const { createDesignSystem } = require(join(out, "generate.js"));
const { PRESETS } = require(join(out, "presets.js"));
const { applyPatch } = require(join(out, "normalize.js"));
const { generateSkillFile } = require(join(out, "skill/generate.js"));
const settings = applyPatch(PRESETS["saas-clean"].settings, { colors: { secondary: "#9243CD" }, project: { name: "Acme Billing", description: "Billing software for small teams.", stack } });
const file = generateSkillFile(createDesignSystem(settings), { presetId: "saas-clean" });
process.stdout.write(file[which]);
console.error(`\n${stack}: ${file.lines} lines, AGENTS.md ${(file.agentsBytes / 1024).toFixed(2)} KiB`);
