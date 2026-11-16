/**
 * Downloads the fonts the tool previews, from Google Fonts, into public/fonts, so the app serves them itself and a visitor's
 * browser never talks to Google. Run it by hand when the font list changes (the result is committed):
 *
 *   node scripts/fetch-fonts.mjs
 *
 * What it writes (all under public/fonts):
 *   css/<slug>.css     one small stylesheet per catalog font: its latin faces, in the weights the catalog says it offers.
 *                      A variable font is one face with a weight range; the file loads only when that font is used.
 *   css/names.css      the picker's name previews (families renamed ds-name-*): tiny files holding only the letters of the names.
 *   css/gallery.css    the pairing cards (families renamed ds-gallery-*): tiny files holding only the letters of the sample lines.
 *   files/ names/ gallery/   the woff2 files those stylesheets point to.
 *   LICENSES.md        the license note.
 * Only the latin range is kept (the preview shows English text). Nothing here changes the generated skill file, which still
 * tells the user's own project to load its fonts from Google.
 */

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const lib = "src/lib/design-system";
const out = mkdtempSync(join(tmpdir(), "dsmd-fonts-"));
try {
  execFileSync("npx", ["tsc", ...["fonts", "font-loading", "font-pairings"].map((f) => `${lib}/${f}.ts`), "--outDir", out, "--module", "commonjs", "--moduleResolution", "node", "--target", "es2020", "--skipLibCheck"], { stdio: "pipe" });
} catch {
  // tsc exits non-zero on type errors but still writes files.
}
const require = createRequire(import.meta.url);
const { FONT_CATALOG } = require(join(out, "fonts.js"));
const { pairingGalleryUrl } = require(join(out, "font-pairings.js"));
const { fontNamesUrl } = require(join(out, "font-loading.js"));

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const root = "public/fonts";
for (const dir of ["css", "files", "names", "gallery"]) {
  rmSync(join(root, dir), { recursive: true, force: true });
  mkdirSync(join(root, dir), { recursive: true });
}

export const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const get = async (url, binary = false) => {
  const response = await fetch(url, { headers: { "User-Agent": UA } });
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  return binary ? Buffer.from(await response.arrayBuffer()) : response.text();
};

/** Splits a Google Fonts stylesheet into its faces. */
function faces(css) {
  return [...css.matchAll(/(?:\/\*\s*([\w-]+)\s*\*\/\s*)?@font-face\s*\{([^}]*)\}/g)].map((m) => {
    const body = m[2];
    const pick = (re) => re.exec(body)?.[1];
    return { subset: m[1] ?? null, family: pick(/font-family:\s*'([^']+)'/), weight: Number(pick(/font-weight:\s*(\d+)/)), url: pick(/url\(([^)]+)\)/), range: pick(/unicode-range:\s*([^;]+);/) ?? null };
  });
}

let totalBytes = 0;
async function save(url, path) {
  const data = await get(url, true);
  writeFileSync(path, data);
  totalBytes += data.length;
  return data.length;
}

// 1. One stylesheet per catalog font: latin faces in the weights the catalog offers.
for (const font of FONT_CATALOG) {
  const api = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.name).replace(/%20/g, "+")}:wght@${font.weights.join(";")}&display=swap`;
  const latin = faces(await get(api)).filter((face) => face.subset === "latin");
  if (latin.length === 0) throw new Error(`no latin face for ${font.name}`);
  const byUrl = new Map();
  for (const face of latin) {
    const entry = byUrl.get(face.url) ?? { weights: [], range: face.range };
    entry.weights.push(face.weight);
    byUrl.set(face.url, entry);
  }
  const blocks = [];
  for (const [url, { weights, range }] of byUrl) {
    const variable = weights.length > 1;
    const name = `${slug(font.name)}-${variable ? "var" : weights[0]}-latin.woff2`;
    await save(url, join(root, "files", name));
    const weight = variable ? `${Math.min(...weights)} ${Math.max(...weights)}` : weights[0];
    blocks.push(`@font-face{font-family:'${font.name}';font-style:normal;font-weight:${weight};font-display:swap;src:url(/fonts/files/${name}) format('woff2');unicode-range:${range}}`);
  }
  let css = blocks.join("\n") + "\n";
  if (font.name === "Inter") {
    // The tool's own text uses this file too. A fallback face with Inter's measurements keeps the text from jumping when it loads.
    css += "@font-face{font-family:'Inter Fallback';src:local(Arial);ascent-override:90.44%;descent-override:22.52%;line-gap-override:0.0%;size-adjust:107.12%}\n";
  }
  writeFileSync(join(root, "css", `${slug(font.name)}.css`), css);
  console.log(font.name.padEnd(22), `${byUrl.size} file(s)`);
}

// 2. Tiny subsets: names for the picker, sample lines for the pairing cards. Families are renamed so they never clash with the real ones.
async function subsets(apiUrl, prefix, dir, cssName) {
  const parsed = faces(await get(apiUrl));
  const blocks = [];
  const seen = new Map();
  for (const face of parsed) {
    if (!seen.has(face.url)) {
      const name = `${slug(face.family)}-${face.weight}-${seen.size}.woff2`;
      await save(face.url, join(root, dir, name));
      seen.set(face.url, name);
    }
    blocks.push(`@font-face{font-family:'${prefix}${face.family}';font-style:normal;font-weight:${face.weight};font-display:swap;src:url(/fonts/${dir}/${seen.get(face.url)}) format('woff2');${face.range ? `unicode-range:${face.range}` : ""}}`);
  }
  writeFileSync(join(root, "css", cssName), blocks.join("\n") + "\n");
  console.log(cssName.padEnd(22), `${seen.size} file(s)`);
}
await subsets(fontNamesUrl(), "ds-name-", "names", "names.css");
await subsets(pairingGalleryUrl(), "ds-gallery-", "gallery", "gallery.css");

writeFileSync(
  join(root, "LICENSES.md"),
  `# Fonts served by Plinth

These font files are copies of the open source fonts listed in \`src/lib/design-system/fonts.ts\`, downloaded from Google Fonts
with \`scripts/fetch-fonts.mjs\`. They are only used for the previews inside the tool, so the visitor's browser never has to ask a
third party for them. Only the latin range is included.

All of them are published under the SIL Open Font License 1.1 (https://openfontlicense.org), and each keeps its own copyright
and license, which you can read on its Google Fonts page. The files here are not modified, except that the small name and sample
subsets keep only the letters they need.

Families: ${FONT_CATALOG.map((font) => font.name).join(", ")}.
`,
);
console.log(`Done. ${(totalBytes / 1024).toFixed(0)} KiB of font files.`);
