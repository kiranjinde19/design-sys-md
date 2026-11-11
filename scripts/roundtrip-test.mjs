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
  ["signature details", "saas-clean", saas, { signature: { featuredHighlight: "corner-ribbon", cardStyle: "glass-blur", hover: "scale-1-02", primaryCta: "gradient-fill", iconContainer: "tinted-circle", focusRing: "thick-outline", divider: "dotted" } }],
  ["tone of voice", "saas-clean", saas, { voice: { formality: 1, energy: 5, detail: 5 } }],
  ["offset shadow and soft ring", "saas-clean", saas, { signature: { featuredHighlight: "offset-shadow", focusRing: "soft-ring" } }],
  ["solid call to action", "saas-clean", saas, { signature: { primaryCta: "solid" } }],
  ["red brand, exact color", "saas-clean", saas, { colors: { brand: "#E54848" } }],
  ["red brand, adjusted for white text", "saas-clean", saas, { colors: { brand: "#E54848", brandMode: "adjusted" } }],
  ["yellow brand", "saas-clean", saas, { colors: { brand: "#FACC15" } }],
  ["near black brand", "saas-clean", saas, { colors: { brand: "#111827" } }],
  ["light indigo brand, adjusted", "saas-clean", saas, { colors: { brand: "#A5B4FC", brandMode: "adjusted" } }],
  ["role overrides", "saas-clean", saas, { colors: { secondary: "#9243CD", roleOverrides: { primary: { scale: "brand", step: 700 }, foreground: { scale: "neutral", step: 800 }, card: { scale: "white" }, input: { scale: "neutral", step: 500 }, ring: { scale: "secondary", step: 600 }, border: { scale: "neutral", step: 300 } } } }],
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

test("SaaS Clean version 4 defaults to the border beam and the crisp border", () => {
  assert.equal(PRESETS["saas-clean"].version, 4);
  assert.equal(saas.signature.primaryCta, "border-beam");
  assert.equal(saas.signature.featuredHighlight, "crisp-border");
  for (const stack of STACKS) {
    const file = generateSkillFile(createDesignSystem(applyPatch(saas, { project: { stack } })), { presetId: "saas-clean" });
    assert.match(file.skill, /@property --beam-angle/, stack);
    assert.match(file.skill, /\.card-featured\{border:2px solid/, stack);
    assert.match(file.skill, /\.card-hover:hover\{[^}]*translateY\(-2px\)[^}]*box-shadow/, stack);
    assert.doesNotMatch(file.skill, /not\(\.card-featured\)/, `${stack}: hover must not exclude the featured card`);
  }
});

test("no generated file contains a glow, for any call to action or featured highlight choice", () => {
  const ctas = ["solid", "border-beam", "gradient-fill", "underline-sweep"];
  const featured = ["crisp-border", "offset-shadow", "solid-accent-fill", "corner-ribbon"];
  for (const stack of STACKS) {
    for (const cta of ctas) {
      for (const f of featured) {
        const settings = applyPatch(saas, { project: { stack }, signature: { primaryCta: cta, featuredHighlight: f } });
        const file = generateSkillFile(createDesignSystem(settings), { presetId: "saas-clean" });
        assert.doesNotMatch(file.skill, /glow/i, `${stack} ${cta} ${f}`);
        assert.doesNotMatch(file.skill, /ds-glow|--glow/, `${stack} ${cta} ${f}`);
        // No box shadow with a blur radius made from a brand color: a halo.
        assert.doesNotMatch(file.skill, /box-shadow:0 0 \d+px/, `${stack} ${cta} ${f}`);
      }
    }
  }
});

test("old glow choices silently become the new ones, from any preset version", () => {
  const block = (preset, presetVersion, signature) => `# Old file\n\n\`\`\`json\n${JSON.stringify({ format: "design-sys-md", version: 1, preset, presetVersion, settings: signature ? { signature } : {} })}\n\`\`\`\n`;
  // Version 1 and 2 of SaaS Clean had the glow as the default, with nothing stored in the file.
  for (const version of [1, 2]) {
    const result = parseSkillFile(block("saas-clean", version));
    assert.ok(result.ok, `version ${version}`);
    assert.equal(result.settings.signature.primaryCta, "border-beam");
    assert.equal(result.settings.signature.featuredHighlight, "crisp-border");
    // Version 1 had the pulsing glow button. Version 2 already had the beam, but both had the glow border.
    assert.equal(result.notices.includes("Replaced the old glow with the border beam."), version === 1);
    assert.ok(result.notices.includes("Replaced the old glow border with the crisp border."));
  }
  // A glow stored on purpose, on another preset and an old version.
  const stored = parseSkillFile(block("blank-slate", 1, { primaryCta: "animated-glow-border", focusRing: "glow-ring" }));
  assert.ok(stored.ok);
  assert.equal(stored.settings.signature.primaryCta, "border-beam");
  assert.equal(stored.settings.signature.focusRing, "soft-ring");
  assert.ok(stored.notices.includes("Replaced the old glow with the border beam."));
  // Exporting again writes the new choices, so the next import has nothing to replace.
  const again = generateSkillFile(createDesignSystem(stored.settings), { presetId: stored.presetId });
  assert.doesNotMatch(again.skill, /glow/i);
  const second = parseSkillFile(again.skill);
  assert.ok(second.ok);
  assert.deepEqual(second.notices, []);
  assert.deepEqual(second.settings, stored.settings);
  // A current file has nothing to replace.
  const current = generateSkillFile(createDesignSystem(saas), { presetId: "saas-clean" });
  assert.deepEqual(parseSkillFile(current.skill).notices, []);
});

test("brand stress test: every brand and mode keeps the generated file's own contrast checks green", () => {
  for (const brand of ["#E54848", "#FACC15", "#0F766E", "#111827", "#A5B4FC"]) {
    for (const brandMode of ["exact", "adjusted"]) {
      for (const stack of STACKS) {
        const settings = applyPatch(saas, { colors: { brand, brandMode }, project: { stack } });
        const ds = createDesignSystem(settings);
        const file = generateSkillFile(ds, { presetId: "saas-clean" });
        const failing = file.skill.split("\n").filter((line) => line.startsWith("|") && / FAIL \|$/.test(line));
        // The chart and placeholder rows may legitimately fall short for extreme brands; text, focus and button rows may not.
        const serious = failing.filter((line) => !/chart|placeholder/i.test(line));
        assert.deepEqual(serious, [], `${brand} ${brandMode} ${stack}`);
        const primary = ds.tokens.colors.brandReport.primaryText;
        assert.ok(primary.ratio >= 4.5 || ds.tokens.colors.brandReport.mode === "exact", `${brand} ${stack}: primary text`);
        assert.match(file.skill, /Primary button text is (white|dark)/, `${brand} ${stack}: the primary text rule`);
        const back = parseSkillFile(file.skill);
        assert.ok(back.ok);
        assert.equal(back.settings.colors.brand, brand);
        assert.equal(back.settings.colors.brandMode, brandMode);
      }
    }
  }
});

test("adjusted mode only changes anything when white text fails", () => {
  const teal = createDesignSystem(applyPatch(saas, { colors: { brand: "#0F766E", brandMode: "adjusted" } })).tokens.colors.brandReport;
  assert.equal(teal.effective, "#0F766E");
  const red = createDesignSystem(applyPatch(saas, { colors: { brand: "#E54848", brandMode: "adjusted" } })).tokens.colors.brandReport;
  assert.equal(red.typed, "#E54848");
  assert.equal(red.adjusted, "#D93C3E");
  assert.equal(red.effective, "#D93C3E");
  assert.equal(red.primaryText.isWhite, true);
  const exact = createDesignSystem(applyPatch(saas, { colors: { brand: "#E54848" } })).tokens.colors.brandReport;
  assert.equal(exact.effective, "#E54848");
  assert.equal(exact.primaryText.isWhite, false);
  assert.equal(exact.whiteFails, true);
  assert.equal(exact.nearError, true);
});

test("a data format version 1 file (no brand mode) still imports, as exact", () => {
  const old = '# Old\n\n```json\n{"format":"design-sys-md","version":1,"preset":"saas-clean","presetVersion":3,"settings":{"colors":{"brand":"#E54848"}}}\n```\n';
  const result = parseSkillFile(old);
  assert.ok(result.ok);
  assert.equal(result.settings.colors.brandMode, "exact");
  assert.equal(result.settings.colors.brand, "#E54848");
});

test("a brand close to the error red uses the foreground color for focus, and says so in the file", () => {
  const red = createDesignSystem(applyPatch(saas, { colors: { brand: "#E54848" } }));
  assert.equal(red.tokens.colors.brandReport.focus, red.tokens.colors.roles.foreground);
  assert.equal(red.tokens.colors.roles.ring, red.tokens.colors.roles.foreground);
  assert.match(red.tokens.signature.focusRing.css.outline, new RegExp(red.tokens.colors.roles.foreground.replace("#", "#"), "i"));
  for (const stack of STACKS) {
    const file = generateSkillFile(red, { stack, presetId: "saas-clean" }).skill;
    assert.match(file, /the focus ring is `foreground`, never brand red/);
  }
  const teal = createDesignSystem(applyPatch(saas, { colors: { brand: "#0F766E" } }));
  assert.notEqual(teal.tokens.colors.brandReport.focus, teal.tokens.colors.roles.foreground);
  assert.doesNotMatch(generateSkillFile(teal, { stack: "html-css", presetId: "saas-clean" }).skill, /never brand red/);
});

test("shadow levels: cards 1, hover 2, menus 3, toasts 4, dialogs 5", () => {
  const ds = createDesignSystem(applyPatch(saas, { signature: { cardStyle: "soft-shadow" }, elevation: { levels: 5 } }));
  const shadows = ds.tokens.elevation.shadows;
  assert.equal(ds.tokens.signature.cardStyle.css.boxShadow, shadows[1].css);
  assert.equal(ds.tokens.signature.hover.css.boxShadow, shadows[2].css);
  const file = generateSkillFile(ds, { stack: "html-css", presetId: "saas-clean" }).skill;
  assert.match(file, /\.dialog ?\{[^}]*var\(--shadow-5\)/);
  assert.match(file, /\.toast ?\{[^}]*var\(--shadow-4\)/);
});

test("chart and metric card recipes carry the accessibility and badge details, in every stack", () => {
  const ds = createDesignSystem(saas);
  for (const stack of STACKS) {
    const file = generateSkillFile(ds, { stack, presetId: "saas-clean" }).skill;
    assert.match(file, /role="img"/);
    assert.match(file, /hidden data table/);
    assert.match(file, /dash style and marker/);
    assert.match(file, /change badge/);
    assert.doesNotMatch(file, /stat__change/);
  }
});

test("a tinted destructive brand keeps solid red hover and pressed tokens for the confirm button", () => {
  const red = createDesignSystem(applyPatch(saas, { colors: { brand: "#E54848" } }));
  const solid = red.tokens.controls.buttons.destructiveSolid;
  for (const stack of STACKS) {
    const file = generateSkillFile(red, { stack, presetId: "saas-clean" }).skill;
    assert.ok(file.toUpperCase().includes(`DESTRUCTIVE-HOVER:${solid.hover.background.toUpperCase()}`.replace(/\s/g, "")) || file.toUpperCase().includes(`DESTRUCTIVE-HOVER: ${solid.hover.background.toUpperCase()}`));
  }
});

test("default, hover and pressed primary buttons are visibly different for the five test brands (lightness gap)", () => {
  const lightness = (hex) => {
    const c = (v) => { const x = parseInt(v, 16) / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
    const [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map(c);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  };
  for (const brand of ["#E54848", "#FACC15", "#0F766E", "#111827", "#A5B4FC", "#4F46E5", "#FFFFFF"]) {
    const v = createDesignSystem(applyPatch(saas, { colors: { brand } })).tokens.controls.buttons.variants.primary;
    const [d, h, p] = [v.default.background, v.hover.background, v.pressed.background].map(lightness);
    assert.ok(Math.abs(h - d) >= 0.03, `${brand}: hover differs from default by ${Math.abs(h - d).toFixed(3)}`);
    assert.ok(Math.abs(p - h) >= 0.03, `${brand}: pressed differs from hover by ${Math.abs(p - h).toFixed(3)}`);
  }
  const dark = createDesignSystem(applyPatch(saas, { colors: { brand: "#111827" } })).tokens;
  assert.equal(dark.colors.brandReport.veryDark, true);
  const v = dark.controls.buttons.variants.primary;
  assert.ok(lightness(v.hover.background) > lightness(v.default.background), "a very dark brand gets lighter on hover");
  assert.ok(lightness(v.pressed.background) > lightness(v.hover.background), "and lighter again when pressed");
  assert.ok(generateSkillFile(createDesignSystem(applyPatch(saas, { colors: { brand: "#111827" } })), { stack: "html-css", presetId: "saas-clean" }).skill.includes("very dark"));
});

test("light brands use the first 3:1 brand step for the featured border and selected outlines; 600 stays the fill", () => {
  const yellow = createDesignSystem(applyPatch(saas, { colors: { brand: "#FACC15" } }));
  const report = yellow.tokens.colors.brandReport;
  assert.notEqual(report.uiStep, 600);
  assert.equal(yellow.tokens.signature.featuredHighlight.css.border, `2px solid ${report.ui}`);
  assert.equal(yellow.tokens.controls.selection.states.checkbox.checked.borderColor, report.ui);
  assert.equal(yellow.tokens.controls.selection.states.checkbox.checked.background, yellow.tokens.colors.roles.primary);
  const indigo = createDesignSystem(saas);
  assert.equal(indigo.tokens.colors.brandReport.uiStep, 600, "an ordinary brand keeps step 600");
  for (const stack of STACKS) {
    const file = generateSkillFile(yellow, { stack, presetId: "saas-clean" }).skill;
    assert.match(file, /3:1/);
  }
});

test("role overrides: saved in the data block (format 3), restored, shown in the file, and old files still import", () => {
  const overrides = { primary: { scale: "brand", step: 700 }, "muted-foreground": { scale: "neutral", step: 700 }, background: { scale: "neutral", step: 50 } };
  const settings = applyPatch(saas, { colors: { roleOverrides: overrides } });
  assert.deepEqual(settings.colors.roleOverrides, overrides);
  for (const stack of STACKS) {
    const file = generateSkillFile(createDesignSystem(settings), { stack, presetId: "saas-clean" }).skill;
    assert.match(file, /"version":3/);
    assert.match(file, /Custom roles \(never change them\): primary brand 700/);
    assert.match(file, /Custom roles unchanged/);
    const back = parseSkillFile(file);
    assert.ok(back.ok);
    assert.deepEqual(back.settings.colors.roleOverrides, overrides);
    const again = generateSkillFile(createDesignSystem(back.settings), { stack, presetId: "saas-clean" }).skill;
    assert.equal(again, file, `${stack}: export, import, export is identical`);
  }
  // A default file has no override text and no override key.
  const plain = generateSkillFile(createDesignSystem(saas), { stack: "html-css", presetId: "saas-clean" }).skill;
  assert.doesNotMatch(plain, /Custom roles \(never/);
  assert.doesNotMatch(plain, /roleOverrides/);
  // The overrides change the real tokens, and brand changes still flow through roles that were not overridden.
  const tokens = createDesignSystem(settings).tokens.colors;
  assert.equal(tokens.roles.primary, tokens.brand[700]);
  const teal = createDesignSystem(applyPatch(settings, { colors: { brand: "#0F766E" } })).tokens.colors;
  assert.equal(teal.roles.primary, teal.brand[700], "an override follows its scale when the brand changes");
  const tealAuto = createDesignSystem(applyPatch(saas, { colors: { brand: "#0F766E" } })).tokens.colors;
  assert.equal(teal.roles.ring, tealAuto.roles.ring, "a role that was not overridden stays automatic");
  // A version 2 file (no overrides) still imports.
  const v2 = '# Old\n\n```json\n{"format":"design-sys-md","version":2,"preset":"saas-clean","presetVersion":4,"settings":{"colors":{"brand":"#0F766E"}}}\n```\n';
  const old = parseSkillFile(v2);
  assert.ok(old.ok);
  assert.equal(old.settings.colors.roleOverrides, undefined);
  // Junk in a file is dropped, not applied.
  const junk = '# X\n\n```json\n{"format":"design-sys-md","version":3,"preset":"saas-clean","presetVersion":4,"settings":{"colors":{"roleOverrides":{"primary":{"scale":"nope","step":600},"ring":{"scale":"brand","step":500},"bogus":{"scale":"brand","step":500}}}}}\n```\n';
  const parsed = parseSkillFile(junk);
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.settings.colors.roleOverrides, { ring: { scale: "brand", step: 500 } });
});
