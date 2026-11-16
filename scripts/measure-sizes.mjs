/**
 * Prints the size of AGENTS.md for the three stacks, for the inputs the size rule in CLAUDE.md talks about.
 *
 *   node scripts/measure-sizes.mjs
 *
 * normal     secondary color, a 30 character name, a 100 character description, default fonts
 * worst      a 60 character name and a 200 character description
 * red brand  the worst case with a brand color near the error red
 * Limits: Next.js under 30 KiB, React under 31, plain HTML 31.7 or less (the hard line is Codex's 32 KiB).
 */

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const lib = "src/lib/design-system";
const out = mkdtempSync(join(tmpdir(), "dsmd-measure-"));
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

const kib = (stack, project, colors) => {
  const settings = applyPatch(PRESETS["saas-clean"].settings, { colors, project: { ...project, stack } });
  return (generateSkillFile(createDesignSystem(settings), { presetId: "saas-clean" }).agentsBytes / 1024).toFixed(3);
};
const normal = { name: "N".repeat(30), description: "D".repeat(100) };
const worst = { name: "N".repeat(60), description: "D".repeat(200) };
for (const [label, stack] of [["Next.js", "next-tailwind-shadcn"], ["React", "react-tailwind"], ["Plain HTML", "html-css"]]) {
  console.log(label.padEnd(11), "normal", kib(stack, normal, { secondary: "#9243CD" }), "| worst", kib(stack, worst, { secondary: "#9243CD" }), "| red brand", kib(stack, worst, { secondary: "#9243CD", brand: "#DC2626" }));
}
