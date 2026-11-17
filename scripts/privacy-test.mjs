/**
 * Privacy test: in a normal session nothing leaves the site. It drives a real headless Chrome through the landing page, the
 * tool (the font picker, the pairing gallery, a font change), Export and Import, records every network request, and fails if
 * any goes to another host. The wording "Your choices stay in your browser" on the landing page, in the README and on the
 * Export screen is only true while this test passes.
 *
 *   node --test scripts/privacy-test.mjs      (or npm run test:fast)
 *
 * It also checks that a first visit to /app loads no font file but the default one (Inter), that other fonts load only when
 * picked or when the picker or the pairing gallery opens, that nothing is sent in a request body, and that no cookie is set.
 */

import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ev, fresh, importFile, navigate, onEvent, send, settle, sleep, start, state, stop, waitFor } from "./lib/cdp.mjs";

const requests = [];
let phase = "start";
before(async () => {
  await start({ width: 1440, height: 1000 });
  onEvent((method, params) => {
    if (method === "Network.requestWillBeSent") requests.push({ phase, method: params.request.method, url: params.request.url, body: Boolean(params.request.postData), type: params.type });
  });
  await send("Network.enable");
  await send("Network.setCacheDisabled", { cacheDisabled: true });
});
after(() => stop());

const mark = (name) => {
  phase = name;
};
const inPhase = (name) => requests.filter((r) => r.phase === name);
const fontFiles = (list) => list.filter((r) => /\.woff2(\?|$)/.test(r.url)).map((r) => new URL(r.url).pathname);
const own = (url) => /^(data|blob|about):/.test(url) || new URL(url).origin === new URL(state.baseUrl).origin;
const click = (expr) => ev(`(()=>{const e=${expr};if(!e)return false;e.click();return true})()`);

test("a first visit to the tool loads only the default font", async () => {
  mark("first visit");
  await fresh("/app");
  await sleep(1200); // elapsed time is the thing measured: a font that would load late has had its chance
  assert.deepEqual(fontFiles(inPhase("first visit")), ["/fonts/files/inter-var-latin.woff2"]);
  assert.equal(await ev(`[...document.querySelectorAll("link")].filter(l=>/fonts\\.(googleapis|gstatic)/.test(l.href)).length`), 0, "no link to Google Fonts");
});

test("the landing page asks nobody for anything", async () => {
  mark("landing");
  await navigate(state.baseUrl + "/", `document.readyState==="complete" && !!document.querySelector(".pl[data-engine=ready]")`);
  await ev(`document.querySelector("#stage").scrollIntoView()`);
  await waitFor(`document.querySelector("#stage").dataset.ghost === "playing"`, { timeout: 15000, label: "the demo to play" });
  await sleep(2500); // let the demo change colors and fonts for a while
  await click(`document.querySelector("button.sw[data-hex='#D6336C']")`);
  await click(`document.querySelector("#fonts button:nth-child(2)")`);
  await click(`document.querySelector("#theme")`);
  await click(`document.querySelector("details summary")`);
  await sleep(500);
  assert.ok(inPhase("landing").length > 5);
  assert.deepEqual(fontFiles(inPhase("landing")).filter((p) => p.startsWith("/fonts/")), [], "the landing page loads none of the tool's font files");
});

test("the font picker, the pairing gallery and a font change load only this site's own files, when they are needed", async () => {
  mark("picker");
  await fresh("/app", { editor: "typography" });
  // Opening the typography editor opens the picker and the pairing gallery.
  await waitFor(`!!document.querySelector("[role=listbox]")`, { label: "the font picker" });
  await waitFor(`!!document.getElementById("ds-font-names")`, { label: "the name stylesheet" });
  assert.equal(await ev(`!!document.getElementById("ds-gallery-fonts")`), false, "the pairing samples load only when their window opens");
  assert.equal(await click(`[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="See samples and details")`), true);
  await waitFor(`!!document.getElementById("ds-gallery-fonts")`, { label: "the gallery stylesheet" });
  await sleep(1200);
  const opened = fontFiles(inPhase("picker"));
  assert.ok(opened.some((p) => p.startsWith("/fonts/names/")), `the picker loaded its name previews (${opened.length} files)`);
  assert.ok(opened.some((p) => p.startsWith("/fonts/gallery/")), "the pairing cards loaded their sample line fonts");
  assert.ok(!opened.some((p) => p.startsWith("/fonts/files/") && !p.includes("inter")), "no full font file is loaded until a font is picked");
  const before = opened.length;
  mark("pick");
  // Pick Fraunces for the heading.
  assert.equal(await click(`[...document.querySelectorAll("[role=option]")].find(b=>b.textContent.trim().startsWith("Fraunces"))`), true);
  await waitFor(`!!document.querySelector('link[href="/fonts/css/fraunces.css"]')`, { label: "Fraunces to be requested" });
  await sleep(1200);
  const picked = fontFiles(inPhase("pick"));
  assert.ok(picked.includes("/fonts/files/fraunces-var-latin.woff2"), `Fraunces loaded from this site (${picked.join(", ")})`);
  assert.ok(before > 0);
  assert.ok(await ev(`document.fonts.check("600 20px Fraunces")`), "and the browser has it");
});

test("Export and Import send nothing anywhere", async () => {
  mark("export");
  await navigate(state.baseUrl + "/app/export");
  await ev(`[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Copy file"))?.click()`);
  await ev(`[...document.querySelectorAll("button")].find(b=>b.textContent.trim().startsWith("Download"))?.click()`);
  await sleep(800);
  mark("import");
  const file = join(mkdtempSync(join(tmpdir(), "privacy-")), "import.md");
  writeFileSync(file, "# X\n\n```json\n" + JSON.stringify({ format: "design-sys-md", version: 3, preset: "saas-clean", presetVersion: 4, settings: { colors: { brand: "#0F8A5F" } } }) + "\n```\n");
  await importFile(file);
  await sleep(500);
  for (const name of ["export", "import"]) {
    assert.deepEqual(inPhase(name).filter((r) => r.method !== "GET" || r.body), [], `${name}: nothing was posted`);
  }
});

test("in the whole session every request goes to the site itself, nothing is posted, and no cookie is set", async () => {
  const outside = requests.filter((r) => !own(r.url));
  assert.deepEqual(outside.map((r) => `${r.phase}: ${r.url.slice(0, 90)}`), [], "requests to other hosts");
  assert.deepEqual(requests.filter((r) => r.method !== "GET").map((r) => `${r.phase}: ${r.method} ${r.url}`), [], "requests that send data");
  assert.deepEqual(requests.filter((r) => r.body).map((r) => r.url), [], "requests with a body");
  for (const path of ["/", "/app", "/app/export"]) {
    await navigate(state.baseUrl + path, null);
    await settle();
    assert.equal(await ev(`document.cookie`), "", `${path}: no cookie`);
  }
  assert.ok(requests.length > 100, `a real session was recorded (${requests.length} requests)`);
});

test("the privacy wording is the same on the landing page, in the README and on the Export screen, and the usage note is on Export and in the README", async () => {
  await navigate(state.baseUrl + "/", `document.readyState==="complete" && !!document.querySelector(".pl[data-engine=ready]")`);
  const answers = await ev(`[...document.querySelectorAll("details")].map(d=>d.textContent)`);
  assert.ok(answers.some((a) => a.includes("Where does my work go?") && a.includes("Your choices stay in your browser and save automatically.")), "the FAQ answer");
  await navigate(state.baseUrl + "/app/export");
  const note = await ev(`document.querySelector("[data-usage-note]").textContent.trim()`);
  assert.equal(note, "Your choices stay in your browser. Files you create with Plinth are yours to use in any project, personal or commercial, and no credit is needed. The open source fonts you choose keep their own licenses.");
  const readme = readFileSync("README.md", "utf8");
  assert.ok(readme.includes("Your choices stay in your browser"), "the README privacy wording");
  assert.ok(readme.includes("Files you create with Plinth are yours to use in any project, personal or commercial, and no credit is needed. The open source fonts you choose keep their own licenses."), "the README usage note");
  for (const text of [note, readme]) assert.equal(/google/i.test(text), false, "no mention of Google in the privacy and usage wording");
});
