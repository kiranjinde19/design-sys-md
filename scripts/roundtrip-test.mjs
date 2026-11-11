// Round trip test: generate a file, import it, generate again, and check both files are identical.
// Run with: npm run test:roundtrip
// It compiles the generator to a temporary folder first, so it needs no extra packages.
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const out = mkdtempSync(join(tmpdir(), "dsmd-"));
const lib = "src/lib/design-system";
try {
  execFileSync(
    "npx",
    ["tsc", ...["generate", "presets", "normalize", "skill/generate", "skill/data-block"].map((f) => `${lib}/${f}.ts`), "--outDir", out, "--module", "commonjs", "--moduleResolution", "node", "--target", "es2020", "--skipLibCheck", "--noEmitOnError", "false"],
    { stdio: "pipe" },
  );
} catch (error) {
  // tsc exits non-zero on type errors but still writes files. Real problems show up as missing files below.
  if (!String(error.stdout ?? "").trim() === false && /error TS/.test(String(error.stdout))) console.warn(String(error.stdout).split("\n").slice(0, 5).join("\n"));
}
const require = createRequire(import.meta.url);
const { createDesignSystem } = require(join(out, "generate.js"));
const { PRESETS } = require(join(out, "presets.js"));
const { applyPatch } = require(join(out, "normalize.js"));
const { generateSkillFile } = require(join(out, "skill/generate.js"));
const { parseSkillFile } = require(join(out, "skill/data-block.js"));

const STACKS = ["next-tailwind-shadcn", "react-tailwind", "html-css"];
const saas = PRESETS["saas-clean"].settings;
const blank = PRESETS["blank-slate"].settings;

/** Different starting points and many different settings, including every kind the file must carry. */
const CASES = [
  ["untouched SaaS Clean", "saas-clean", saas, {}],
  ["untouched Blank slate", "blank-slate", blank, {}],
  ["teal brand color", "saas-clean", saas, { colors: { brand: "#0D9488" } }],
  ["secondary color", "saas-clean", saas, { colors: { brand: "#E11D48", secondary: "#9243CD" } }],
  ["product name and description", "saas-clean", saas, { project: { name: "Acme Billing", description: "Billing software for small teams." } }],
  ["type scale, tracking, line height", "saas-clean", saas, { typography: { scaleRatio: 1.333, baseSize: 18, lineHeight: 1.6, headingTracking: -0.01 } }],
  ["radius and spacing", "saas-clean", saas, { radius: { base: 4 }, spacing: { base: 8, density: "compact" } }],
  ["borders and shadows", "saas-clean", saas, { borders: { width: 2, colorStep: 300 }, elevation: { levels: 3, intensity: 80, style: "hard" } }],
  ["buttons and inputs", "saas-clean", saas, { controls: { secondaryStyle: "outline", height: 48 } }],
  ["icons", "saas-clean", saas, { icons: { style: "solid", strokeWidth: 2, ends: "sharp" } }],
  ["signature details", "saas-clean", saas, { signature: { featuredHighlight: "offset-shadow", cardStyle: "glass-blur", hover: "scale", primaryCta: "gradient-fill", iconContainer: "tinted-circle", focusRing: "thick-outline", divider: "dotted" } }],
  ["tone of voice", "saas-clean", saas, { voice: { formality: 1, energy: 5, detail: 5 } }],
  ["old animated glow border chosen again", "saas-clean", saas, { signature: { primaryCta: "animated-glow-border" } }],
  ["solid call to action", "saas-clean", saas, { signature: { primaryCta: "solid" } }],
  ["everything at once", "blank-slate", blank, { colors: { brand: "#2563EB", secondary: "#F59E0B" }, radius: { base: 16 }, voice: { formality: 2, energy: 3, detail: 4 }, project: { name: "Northwind 2025", description: "Inventory tools." } }],
];

for (const stack of STACKS) {
  for (const [label, presetId, base, patch] of CASES) {
    test(`round trip: ${label} (${stack})`, () => {
      const settings = applyPatch(applyPatch(base, patch), { project: { ...(patch.project ?? {}), stack } });
      const first = generateSkillFile(createDesignSystem(settings), { presetId });
      // Guard against a patch that silently did nothing (for example a misspelled option).
      const untouched = label.startsWith("untouched");
      assert.equal(JSON.stringify(settings) === JSON.stringify({ ...base, project: { ...base.project, stack } }), untouched, `${label}: the patch should change the settings`);
      for (const [kind, text] of [["SKILL.md", first.skill], ["AGENTS.md", first.agents]]) {
        const imported = parseSkillFile(text);
        assert.ok(imported.ok, `${kind} should import: ${imported.error}`);
        assert.equal(imported.presetId, presetId);
        assert.deepEqual(imported.settings, settings, `${kind}: restored settings differ`);
        assert.equal(imported.settings.project.stack, stack);
        assert.equal(imported.settings.project.name, settings.project.name);
        assert.equal(imported.settings.project.description, settings.project.description);
        const second = generateSkillFile(createDesignSystem(imported.settings), { presetId: imported.presetId });
        assert.equal(second.skill, first.skill, `${kind}: the second SKILL.md differs`);
        assert.equal(second.agents, first.agents, `${kind}: the second AGENTS.md differs`);
      }
    });
  }
}

test("importing the same file twice in a row gives the same result", () => {
  const first = generateSkillFile(createDesignSystem(applyPatch(saas, { colors: { brand: "#0D9488" } })), { presetId: "saas-clean" });
  const a = parseSkillFile(first.skill);
  const b = parseSkillFile(first.skill);
  assert.deepEqual(a, b);
});

test("a renamed copy and an AGENTS.md without frontmatter both import", () => {
  const file = generateSkillFile(createDesignSystem(applyPatch(saas, { colors: { brand: "#0D9488" } })), { presetId: "saas-clean" });
  assert.ok(parseSkillFile(file.agents).ok);
  assert.ok(parseSkillFile(`notes before\n\n${file.skill}\n\nnotes after`).ok);
});

test("the summary counts changes from the preset", () => {
  const file = generateSkillFile(createDesignSystem(applyPatch(saas, { colors: { brand: "#0D9488" }, project: { name: "Acme Billing" } })), { presetId: "saas-clean" });
  const result = parseSkillFile(file.skill);
  assert.ok(result.ok);
  assert.equal(result.changes, 2);
});

test("older files without a preset version or format version still import", () => {
  const old = '# Old\n\n```json\n{"format":"design-sys-md","preset":"saas-clean","settings":{"colors":{"brand":"#0D9488"}}}\n```\n';
  const result = parseSkillFile(old);
  assert.ok(result.ok);
  assert.equal(result.settings.colors.brand, "#0D9488");
});

test("failures say why", () => {
  assert.match(parseSkillFile("# Just notes\n\nNo block here.").error, /No data block found/);
  assert.match(parseSkillFile('```json\n{"hello":1}\n```').error, /No data block found/);
  assert.match(parseSkillFile('```json\n{"format":"design-sys-md","settings":{,}\n```').error, /Invalid JSON/);
  assert.match(parseSkillFile('```json\n{"format":"design-sys-md","version":99,"settings":{}}\n```').error, /Unsupported version/);
  assert.match(parseSkillFile('```json\n{"format":"design-sys-md","preset":"saas-clean","presetVersion":99,"settings":{}}\n```').error, /Unsupported version/);
  assert.match(parseSkillFile('```json\n{"format":"design-sys-md"}\n```').error, /no settings/);
});

test("SaaS Clean version 2 defaults to the border beam", () => {
  assert.equal(PRESETS["saas-clean"].version, 2);
  assert.equal(saas.signature.primaryCta, "border-beam");
  const file = generateSkillFile(createDesignSystem(saas), { presetId: "saas-clean" });
  assert.match(file.skill, /@property --beam-angle/);
  assert.doesNotMatch(file.skill, /--glow-rest/);
});

test("a preset version 1 file keeps its animated glow border", () => {
  const v1 = '# Old file\n\n```json\n{"format":"design-sys-md","version":1,"preset":"saas-clean","presetVersion":1,"settings":{"colors":{"brand":"#0D9488"}}}\n```\n';
  const result = parseSkillFile(v1);
  assert.ok(result.ok);
  assert.equal(result.settings.signature.primaryCta, "animated-glow-border");
  assert.equal(result.settings.colors.brand, "#0D9488");
  // Importing, then exporting again, keeps the glow and does not turn into the beam.
  const again = generateSkillFile(createDesignSystem(result.settings), { presetId: result.presetId });
  assert.match(again.skill, /ds-glow-border/);
  assert.doesNotMatch(again.skill, /@property --beam-angle/);
  // Its own data block now records the choice, so the next import is exact too.
  const second = parseSkillFile(again.skill);
  assert.ok(second.ok);
  assert.equal(second.settings.signature.primaryCta, "animated-glow-border");
  assert.deepEqual(second.settings, result.settings);
});
