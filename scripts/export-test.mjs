/**
 * Export screen tests (/app/export), in a real headless Chrome with real browser input: real clicks and key presses,
 * real downloads written to disk, the real clipboard and real file choices. No extra packages.
 *
 *   npm run test:live        runs this file together with live-behavior-test.mjs
 *   LIVE_URL=http://localhost:3001 node --test scripts/export-test.mjs
 */

import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9600 + Math.floor(Math.random() * 300);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let baseUrl = process.env.LIVE_URL ?? "http://localhost:3000";
let server = null;
let chrome = null;
let ws = null;
let nextId = 0;
const pending = new Map();
const work = mkdtempSync(join(tmpdir(), "export-test-"));
const downloads = join(work, "downloads");

const reachable = async (url) => {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(2000) })).ok;
  } catch {
    return false;
  }
};
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
async function ev(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(`Page error: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}\n${expression}`);
  return r.result?.value;
}
async function open(path, { reduced = false } = {}) {
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reduced ? "reduce" : "no-preference" }] });
  await send("Page.navigate", { url: baseUrl + path });
  await sleep(2400);
}
/** Clean browser state, theme chosen, then the page. */
async function fresh(path = "/app/export", theme = "light") {
  await send("Page.navigate", { url: baseUrl + "/favicon.ico" });
  await sleep(500);
  await ev(`localStorage.clear();sessionStorage.clear();localStorage.setItem("design-sys-md:tool-theme","${theme}")`);
  await open(path);
}
const asExpr = (s) => (/^(document\.|\[\.\.\.|\()/.test(s) ? s : `document.querySelector(${JSON.stringify(s)})`);
const rectOf = (selector) => `(()=>{const e=${asExpr(selector)};if(!e)return null;e.scrollIntoView({block:"center",inline:"center"});const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`;
async function click(selector) {
  const p = await ev(rectOf(selector));
  assert.ok(p, `element not found: ${selector}`);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: p.x, y: p.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: p.x, y: p.y, button: "left", clickCount: 1 });
  await sleep(300);
}
const KEYS = { Enter: 13, ArrowRight: 39, ArrowLeft: 37, Home: 36, End: 35, Tab: 9, Escape: 27 };
async function key(k, modifiers = 0) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code: k, modifiers, windowsVirtualKeyCode: KEYS[k], text: k === "Enter" ? "\r" : undefined });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: k, modifiers, windowsVirtualKeyCode: KEYS[k] });
  await sleep(150);
}
/** Types into a field with real input: click, select all, type. */
async function type(selector, text) {
  await click(selector);
  await ev(`document.querySelector(${JSON.stringify(selector)}).select()`);
  if (text === "") {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 });
  } else {
    await send("Input.insertText", { text });
  }
  await sleep(250);
}
const byText = (css, text) => `[...document.querySelectorAll(${JSON.stringify(css)})].find(e=>e.textContent.trim().startsWith(${JSON.stringify(text)}))`;
const rawText = async () => {
  await click(`document.querySelectorAll("[role=tablist] [role=tab]")[1]`);
  return ev(`document.querySelector("[role=tabpanel] pre").textContent`);
};
const renderedTab = () => click(`document.querySelectorAll("[role=tablist] [role=tab]")[0]`);
const chooseStack = (id) => click(`document.querySelector('input[name="stack"][value="${id}"]')`);
const chooseFile = (which) => click(byText("button", which === "skill" ? "SKILL.md, Claude Code" : "AGENTS.md, Codex"));
const meter = () => ev(`(()=>{const m=document.querySelector("[data-size-state]");return {state:m.dataset.sizeState,text:m.querySelector("span.tabular-nums").textContent}})()`);

async function waitForDownload(name) {
  for (let i = 0; i < 40; i++) {
    const files = readdirSync(downloads).filter((f) => !f.endsWith(".crdownload"));
    if (files.includes(name)) return readFileSync(join(downloads, name));
    await sleep(150);
  }
  throw new Error(`no download named ${name}; found: ${readdirSync(downloads).join(", ")}`);
}
async function download(stack, which) {
  await chooseStack(stack);
  await chooseFile(which);
  const name = which === "skill" ? "SKILL.md" : "AGENTS.md";
  if (existsSync(join(downloads, name))) {
    // A new download of the same name: Chrome adds (1). Start from an empty folder each time.
    for (const f of readdirSync(downloads)) writeFileSync(join(downloads, f), "");
  }
  await click(byText("button", `Download ${name}`));
  const file = await waitForDownload(name);
  return { name, content: file.toString("utf8"), bytes: file.length };
}

/** Imports a file through the real file input (the same one the Choose file button opens). */
async function importPath(path) {
  const r = await send("Runtime.evaluate", { expression: `document.querySelector('input[type=file]')` });
  await send("DOM.setFileInputFiles", { files: [path], objectId: r.result.objectId });
  await sleep(700);
}
const statusText = () => ev(`[...document.querySelectorAll("[role=status]")].map(e=>e.innerText.trim()).filter(Boolean).join(" | ")`);
const tmpFile = (name, content) => {
  const path = join(work, name);
  writeFileSync(path, content);
  return path;
};
const block = (settings, version = 3) => "# X\n\nSome text.\n\n```json\n" + JSON.stringify({ format: "design-sys-md", version, preset: "saas-clean", presetVersion: 4, settings }) + "\n```\n";

before(async () => {
  if (!process.env.LIVE_URL && !(await reachable(baseUrl))) {
    baseUrl = "http://localhost:3123";
    server = spawn("npx", ["next", "start", "-p", "3123"], { stdio: "ignore" });
    for (let i = 0; i < 40 && !(await reachable(baseUrl + "/app")); i++) await sleep(500);
  }
  assert.ok(await reachable(baseUrl + "/app/export"), `no server at ${baseUrl}`);
  chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, "--disable-gpu", "--window-size=1440,1000", `--user-data-dir=${mkdtempSync(join(tmpdir(), "export-chrome-"))}`, "about:blank"], { stdio: "ignore" });
  let target = null;
  for (let i = 0; i < 40 && !target; i++) {
    await sleep(300);
    try {
      target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === "page");
    } catch {
      // Chrome is still starting.
    }
  }
  assert.ok(target, "Chrome did not start");
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (event) => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m.result ?? m.error);
      pending.delete(m.id);
    }
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("DOM.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Browser.grantPermissions", { permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"] }).catch(() => {});
  const { mkdirSync } = await import("node:fs");
  mkdirSync(downloads, { recursive: true });
  const r = await send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloads, eventsEnabled: true });
  if (r?.code) await send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: downloads });
});

after(() => {
  try {
    ws?.close();
  } catch {
    // Already closed.
  }
  chrome?.kill();
  server?.kill();
});

// ---------------------------------------------------------------------------------------------- navigation

test("the top bar Export file opens /app/export with one primary button, and the browser Back button returns", async () => {
  await fresh("/app");
  await click(byText("a", "Export file"));
  await sleep(1200);
  assert.equal(await ev(`location.pathname`), "/app/export");
  assert.equal(await ev(`document.querySelectorAll(".tool-btn--primary").length`), 1, "exactly one primary button on the screen");
  assert.equal(await ev(`document.querySelector(".tool-btn--primary").textContent.trim()`), "Download SKILL.md");
  assert.equal(await ev(`!!${byText("header a", "Back to editing")}`), true, "the top bar offers Back to editing");
  assert.equal(await ev(`!!${byText("header a", "Export file")}`), false, "no second Export button");
  await chooseFile("agents");
  assert.equal(await ev(`document.querySelector(".tool-btn--primary").textContent.trim()`), "Download AGENTS.md");
  await ev(`history.back()`);
  await sleep(1200);
  assert.equal(await ev(`location.pathname`), "/app", "browser Back returns to the board");
  // Back to editing is a link to the board too.
  await click(byText("a", "Export file"));
  await sleep(900);
  await click(byText("header a", "Back to editing"));
  await sleep(900);
  assert.equal(await ev(`location.pathname`), "/app");
});

test("the old wizard pages are gone, the skill review pages stay", async () => {
  for (const [path, expected] of [["/debug", 404], ["/debug/data", 404], ["/debug/skill", 200], ["/debug/skill/react-tailwind", 200], ["/debug/skill/html-css", 200]]) {
    assert.equal((await fetch(baseUrl + path)).status, expected, path);
  }
});

// ---------------------------------------------------------------------------------------------- product, stack, download

test("product name and line: saved, shown in the file, folder names and slash command follow, an empty line is left out", async () => {
  await fresh();
  await type("#product-name", "Acme Billing");
  await type("#product-line", "Billing software for small teams.");
  let raw = await rawText();
  assert.match(raw, /^---\nname: acme-billing-design-system\n/);
  assert.match(raw, /Use for ANY UI work in Acme Billing:/);
  assert.match(raw, /Billing software for small teams\./);
  assert.match(raw, /"name":"Acme Billing"/, "the data block holds the name");
  const install = await ev(`document.querySelector("#install-title").closest("section").innerText`);
  assert.match(install, /\.claude\/skills\/acme-billing-design-system\//);
  assert.match(install, /~\/\.claude\/skills\/acme-billing-design-system\//);
  assert.match(install, /\/acme-billing-design-system/);
  // Autosave: a reload keeps both.
  await open("/app/export");
  assert.equal(await ev(`document.querySelector("#product-name").value`), "Acme Billing");
  assert.equal(await ev(`document.querySelector("#product-line").value`), "Billing software for small teams.");
  // An empty line is left out of the file.
  await type("#product-line", "");
  raw = await rawText();
  assert.ok(!/Billing software for small teams\./.test(raw), "the empty line is left out");
  assert.match(raw, /Acme Billing/);
});

test("the stack choice uses real radio inputs in a fieldset with a legend, and changes the file and the install steps", async () => {
  await fresh();
  const structure = await ev(`(()=>{const f=document.querySelector("fieldset");return {legend:f.querySelector("legend").textContent,radios:[...f.querySelectorAll('input[type=radio]')].map(r=>r.value),checked:f.querySelector("input:checked").value}})()`);
  assert.equal(structure.legend, "Stack the file is written for");
  assert.deepEqual(structure.radios, ["next-tailwind-shadcn", "react-tailwind", "html-css"]);
  assert.equal(structure.checked, "next-tailwind-shadcn");
  const seen = {};
  for (const id of structure.radios) {
    await chooseStack(id);
    const raw = await rawText();
    const then = await ev(`document.querySelector("#install-title").closest("section").innerText.split("Then:")[1]`);
    seen[id] = { raw, then };
    await renderedTab();
  }
  assert.match(seen["next-tailwind-shadcn"].raw, /Stack: Next\.js/);
  assert.match(seen["react-tailwind"].raw, /Stack: React/);
  assert.match(seen["html-css"].raw, /Stack: Plain HTML/);
  assert.notEqual(seen["next-tailwind-shadcn"].raw, seen["html-css"].raw);
  assert.match(seen["html-css"].then, /link the generated CSS/);
  assert.match(seen["next-tailwind-shadcn"].then, /starter home page/);
  // A real keyboard works on the radios.
  await click(`document.querySelector('input[name="stack"][value="next-tailwind-shadcn"]')`);
  await key("ArrowRight");
  assert.equal(await ev(`document.querySelector('input[name="stack"]:checked').value`), "react-tailwind");
});

test("Download saves the selected file with the right name and the exact content, for all three stacks and both files", async () => {
  await fresh();
  await type("#product-name", "Acme Billing");
  for (const stack of ["next-tailwind-shadcn", "react-tailwind", "html-css"]) {
    const skill = await download(stack, "skill");
    const agents = await download(stack, "agents");
    assert.equal(skill.name, "SKILL.md");
    assert.equal(agents.name, "AGENTS.md");
    assert.match(skill.content, /^---\nname: acme-billing-design-system\ndescription: "/, `${stack}: SKILL.md starts with frontmatter`);
    assert.ok(!agents.content.startsWith("---"), `${stack}: AGENTS.md has no frontmatter`);
    // AGENTS.md is the same content without the frontmatter.
    const body = skill.content.slice(skill.content.indexOf("\n---\n", 4) + 5);
    assert.equal(agents.content, body, `${stack}: AGENTS.md equals SKILL.md without its frontmatter`);
    assert.match(agents.content, /```json\n\{"format":"design-sys-md","version":3,/, `${stack}: ends with the data block`);
    // What was downloaded is what the Raw view shows.
    await chooseFile("skill");
    assert.equal(await rawText(), skill.content, `${stack}: the Raw view equals the downloaded SKILL.md`);
    await chooseFile("agents");
    assert.equal(await rawText(), agents.content, `${stack}: the Raw view equals the downloaded AGENTS.md`);
    // The size meter measures the real AGENTS.md bytes.
    const shown = Number((await meter()).text.split(" ")[0]);
    assert.ok(Math.abs(shown - agents.bytes / 1024) < 0.06, `${stack}: the meter shows ${shown} KiB for ${(agents.bytes / 1024).toFixed(2)} KiB`);
    await renderedTab();
  }
});

test("Copy file copies the selected file and confirms it visibly and in a live region", async () => {
  await fresh();
  await chooseStack("html-css");
  const before = await ev(`document.querySelector('[aria-label=Download] [role=status]')?.textContent ?? ""`);
  assert.equal(before.trim(), "");
  await click(byText("button", "Copy file"));
  assert.equal(await ev(`${byText("button", "Copied")}?.textContent.trim()`), "Copied", "a visible Copied on the button");
  assert.match(await ev(`document.querySelector('[aria-label=Download] [role=status]').textContent`), /Copied SKILL\.md to the clipboard\./, "announced in a polite live region");
  assert.equal(await ev(`document.querySelector('[aria-label=Download] [role=status]').getAttribute("aria-live")`), "polite");
  const clip = await ev(`navigator.clipboard.readText()`);
  assert.equal(clip, await rawText(), "the clipboard holds the exact file");
  await sleep(2800);
  await chooseFile("agents");
  await click(byText("button", "Copy file"));
  assert.equal(await ev(`navigator.clipboard.readText()`), await rawText());
  assert.ok(!(await ev(`navigator.clipboard.readText()`)).startsWith("---"), "AGENTS.md has no frontmatter");
});

// ---------------------------------------------------------------------------------------------- size meter and import

const OWN_FONTS = { headingFont: { kind: "brand", name: "Northwind Brand Display Grotesk Pro", fallback: "Fraunces" }, bodyFont: { kind: "brand", name: "Northwind Brand Text Sans Pro", fallback: "Inter" } };
const NAME60 = "Acme Billing Platform for Growing Teams And Studios Worldwide";
const DESC200 = "Billing and invoicing software for small teams. ".repeat(5).slice(0, 200);

test("the size meter is neutral below 30 KiB, a gentle note from 30 KiB, a strong warning above 32 KiB, with an icon and words", async () => {
  await fresh();
  // Below 30 KiB: Next.js, default.
  let m = await meter();
  assert.equal(m.state, "fits");
  assert.ok(Number.parseFloat(m.text) < 30, m.text);
  assert.equal(await ev(`!!document.querySelector("[data-size-state] svg")`), false, "no status icon while it fits");
  // 30 to 32 KiB: plain HTML with a secondary color, a 30 character name and a 100 character description.
  await importPath(tmpFile("near.md", block({ project: { name: "Acme Billing Platform for Teams".slice(0, 30), description: DESC200.slice(0, 100), stack: "html-css" }, colors: { secondary: "#9243CD" } })));
  m = await meter();
  assert.equal(m.state, "near", m.text);
  assert.ok(Number.parseFloat(m.text) >= 30 && Number.parseFloat(m.text) <= 32, m.text);
  let box = await ev(`(()=>{const p=document.querySelector("[data-size-state] p.flex");return {icon:!!p.querySelector("svg"),text:p.textContent,bg:getComputedStyle(p).backgroundColor}})()`);
  assert.equal(box.icon, true, "an icon");
  assert.match(box.text, /Close to the limit/, "and words");
  // Above 32 KiB: plain HTML, red brand, 60 and 200 character texts, own fonts, a secondary color.
  await importPath(tmpFile("over.md", block({ project: { name: NAME60, description: DESC200, stack: "html-css" }, colors: { secondary: "#9243CD", brand: "#E54848" }, typography: OWN_FONTS })));
  m = await meter();
  assert.equal(m.state, "over", m.text);
  assert.ok(Number.parseFloat(m.text) > 32, m.text);
  box = await ev(`(()=>{const p=document.querySelector("[data-size-state] [role=alert]");return {icon:!!p.querySelector("svg"),text:p.textContent}})()`);
  assert.equal(box.icon, true, "an icon");
  assert.match(box.text, /Over the limit/);
  assert.match(box.text, /project_doc_max_bytes/, "with the note about project_doc_max_bytes");
  assert.equal(await ev(`document.querySelector("[role=meter]").getAttribute("aria-valuetext")`), m.text);
});

test("What is inside lists the sections present, and Custom roles only when roles were overridden", async () => {
  await fresh();
  const chips = () => ev(`[...document.querySelectorAll('[aria-label="What is inside"] span')].slice(1).map(s=>s.textContent)`);
  const plain = await chips();
  assert.ok(plain.includes("Hard rules") && plain.includes("Tokens") && plain.includes("Final checklist") && plain.includes("Data block"), plain.join(", "));
  assert.ok(!plain.includes("Custom roles"));
  await importPath(tmpFile("roles.md", block({ colors: { roleOverrides: { primary: "brand-700", ring: "brand-800" } } })));
  const withRoles = await chips();
  assert.ok(withRoles.includes("Custom roles"), withRoles.join(", "));
  assert.match(await rawText(), /Custom roles \(never change them\): primary, ring\./);
  assert.match(await ev(`document.querySelector("[data-file-info]").textContent`), /^SKILL\.md, \d+ lines, \d+\.\d KiB$/);
});

test("import: success summary, failures with a clear reason, and the same file twice", async () => {
  await fresh();
  const ok = tmpFile("good.md", block({ project: { name: "Acme Billing" }, colors: { brand: "#0F766E" } }));
  await importPath(ok);
  let s = await statusText();
  assert.match(s, /Restored SaaS Clean with \d+ changes?\. Product name Acme Billing\./);
  assert.equal(await ev(`document.querySelector("[data-import-file]").textContent`), "good.md", "the file name is shown");
  assert.equal(await ev(`document.querySelector("#product-name").value`), "Acme Billing");
  // The same file twice: the second import runs again (it restores the name after it was changed).
  await type("#product-name", "Changed");
  assert.equal(await ev(`document.querySelector("#product-name").value`), "Changed");
  await importPath(ok);
  assert.equal(await ev(`document.querySelector("#product-name").value`), "Acme Billing", "choosing the same file again works");
  // Failures.
  await importPath(tmpFile("empty.md", ""));
  assert.match(await statusText(), /The file is empty\./);
  await importPath(tmpFile("picture.png", "not a markdown file"));
  assert.match(await statusText(), /not a Markdown file/);
  await importPath(tmpFile("plain.md", "# Just a note\n\nNo data block here.\n"));
  assert.match(await statusText(), /No data block found/);
  await importPath(tmpFile("broken.md", "# X\n\n```json\n{not valid json\n```\n"));
  assert.match(await statusText(), /No data block found\. The file has JSON, but none of it is a Design Sys\.md data block/);
  await importPath(tmpFile("future.md", block({}, 99)));
  assert.match(await statusText(), /Unsupported version/);
  // A failed import keeps the work.
  assert.equal(await ev(`document.querySelector("#product-name").value`), "Acme Billing");
  // The result sits in a polite live region.
  assert.equal(await ev(`document.querySelector("[data-import-file]").closest("section").querySelector("[role=status]").getAttribute("aria-live")`), "polite");
});

test("import by dropping a file on the card works, and the top bar Import file works from the board with the same feedback", async () => {
  await fresh();
  const file = tmpFile("dropped.md", block({ project: { name: "Dropped Co" } }));
  const card = `document.querySelector('section[aria-label="Import a previous file"]')`;
  const p = await ev(rectOf(card));
  const data = { items: [{ mimeType: "text/markdown", data: "" }], files: [file], dragOperationsMask: 1 };
  await send("Input.dispatchDragEvent", { type: "dragEnter", x: p.x, y: p.y, data });
  await send("Input.dispatchDragEvent", { type: "dragOver", x: p.x, y: p.y, data });
  assert.match(await ev(`document.querySelector("[data-import-file]").textContent`), /Drop the file to import it/, "the card shows a drop target");
  await send("Input.dispatchDragEvent", { type: "drop", x: p.x, y: p.y, data });
  await sleep(700);
  assert.equal(await ev(`document.querySelector("#product-name").value`), "Dropped Co");
  assert.match(await statusText(), /Restored SaaS Clean/);
  // From the board: the top bar button, the same hidden input, a banner with the result.
  await fresh("/app");
  await importPath(tmpFile("top.md", block({ project: { name: "From The Top" } })));
  const banner = await ev(`document.querySelector("[role=status]").innerText`);
  assert.match(banner, /top\.md\. Restored SaaS Clean with \d+ changes?\. Product name From The Top\./);
  await click(`[aria-label="Dismiss"]`);
  assert.equal((await ev(`document.querySelector("header + [role=status]").innerText`)).trim(), "");
  await click(byText("a", "Export file"));
  await sleep(900);
  assert.equal(await ev(`document.querySelector("#product-name").value`), "From The Top", "the import is shared state");
});

test("export, import, export gives an identical file", async () => {
  await fresh();
  await type("#product-name", "Acme Billing");
  await type("#product-line", "Billing software for small teams.");
  const a = await download("react-tailwind", "skill");
  await fresh();
  await importPath(tmpFile("round.md", a.content));
  assert.match(await statusText(), /Restored SaaS Clean/);
  const b = await download("react-tailwind", "skill");
  assert.equal(b.content, a.content, "SKILL.md is identical after a round trip");
  const agents = await download("react-tailwind", "agents");
  await fresh();
  await importPath(tmpFile("AGENTS.md", agents.content));
  const again = await download("react-tailwind", "agents");
  assert.equal(again.content, agents.content, "AGENTS.md is identical after a round trip");
});

// ---------------------------------------------------------------------------------------------- tabs, safety, layout

test("Rendered and Raw are real tabs: arrow keys, Home and End move between them", async () => {
  await fresh();
  const tabs = `document.querySelectorAll('[role=tablist] [role=tab]')`;
  assert.equal(await ev(`document.querySelector("[role=tablist]").getAttribute("aria-label")`), "File view");
  assert.equal(await ev(`${tabs}[0].getAttribute("aria-selected")`), "true");
  assert.equal(await ev(`${tabs}[1].tabIndex`), -1, "one tab stop: the selected tab");
  assert.equal(await ev(`${tabs}[0].getAttribute("aria-controls")===document.querySelector("[role=tabpanel]").id`), true);
  await ev(`${tabs}[0].focus()`);
  await key("ArrowRight");
  assert.equal(await ev(`${tabs}[1].getAttribute("aria-selected")`), "true", "ArrowRight selects Raw");
  assert.equal(await ev(`document.activeElement===${tabs}[1]`), true, "and moves focus to it");
  assert.equal(await ev(`!!document.querySelector("[role=tabpanel] pre")`), true, "Raw shows plain text");
  assert.equal(await ev(`getComputedStyle(document.querySelector("[role=tabpanel] pre")).fontFamily.includes("mono")||getComputedStyle(document.querySelector("[role=tabpanel] pre")).fontFamily.includes("Mono")`), true, "in a monospace font");
  await key("ArrowLeft");
  assert.equal(await ev(`${tabs}[0].getAttribute("aria-selected")`), "true");
  assert.equal(await ev(`!!document.querySelector("[role=tabpanel] .export-sheet")`), true, "Rendered shows the document sheet");
  await key("End");
  assert.equal(await ev(`${tabs}[1].getAttribute("aria-selected")`), "true", "End selects the last tab");
  await key("Home");
  assert.equal(await ev(`${tabs}[0].getAttribute("aria-selected")`), "true", "Home selects the first tab");
  // The panel scrolls inside the card, with a fade; the page itself does not grow with the file.
  const m = await ev(`(()=>{const p=document.querySelector("[role=tabpanel]");return {scrolls:p.scrollHeight>p.clientHeight+100,fade:!!document.querySelector(".export-fade"),page:document.documentElement.scrollHeight}})()`);
  assert.equal(m.scrolls, true, "the document scrolls inside its card");
  assert.equal(m.fade, true, "with a bottom fade");
  assert.ok(m.page < 3200, `the page is not as tall as the file (${m.page}px)`);
});

test("the file is rendered safely: markup in the product line shows as text and never runs", async () => {
  await fresh();
  await type("#product-line", `<img src=x onerror="window.__pwned=1"><script>window.__pwned=2</script>`);
  await sleep(500);
  assert.equal(await ev(`!!document.querySelector("[role=tabpanel] img")`), false, "no injected element");
  assert.equal(await ev(`window.__pwned`), undefined, "nothing ran");
  assert.match(await ev(`document.querySelector("[role=tabpanel]").innerText`), /img src=x onerror=/, "the text is shown as plain text, with the angle brackets removed");
});

test("no sideways scrolling at 1280 and 1440, in either view, and the layout holds", async () => {
  await fresh();
  try {
    for (const width of [1280, 1440]) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      await sleep(500);
      for (const view of ["rendered", "raw"]) {
        if (view === "raw") await rawText();
        else await renderedTab();
        const m = await ev(`({doc:document.documentElement.scrollWidth,win:window.innerWidth,cols:[...document.querySelectorAll("main > div.flex-wrap > *")].map(e=>Math.round(e.getBoundingClientRect().width))})`);
        assert.ok(m.doc <= m.win, `${width} ${view}: the page is ${m.doc}px wide in a ${m.win}px window`);
      }
    }
    await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await sleep(400);
    const cols = await ev(`[...document.querySelectorAll("main > div.flex-wrap > *")].map(e=>Math.round(e.getBoundingClientRect().width))`);
    assert.equal(cols[0], 480, "the left column is 480px wide, as in the mockup");
  } finally {
    await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  }
});

test("focus is always visible, the tab order follows the page, and every control has a label", async () => {
  await fresh();
  const order = await ev(`(()=>{const t=[...document.querySelectorAll("a[href],button,input,select,textarea,[tabindex]")].filter(e=>e.tabIndex>=0&&!e.closest("[hidden]")&&e.getBoundingClientRect().width>0);return {positive:t.filter(e=>e.tabIndex>0).length,items:t.map(e=>({tag:e.tagName,label:(e.getAttribute("aria-label")||e.labels?.[0]?.textContent||e.textContent||"").trim().slice(0,30),top:Math.round(e.getBoundingClientRect().top+scrollY),left:Math.round(e.getBoundingClientRect().left)}))}})()`);
  assert.equal(order.positive, 0, "no positive tabindex");
  for (const item of order.items) assert.ok(item.label.length > 0, `a control without a name: ${JSON.stringify(item)}`);
  const left = order.items.filter((i) => i.left < 520 && i.top > 150);
  for (let i = 1; i < left.length; i++) assert.ok(left[i].top >= left[i - 1].top - 2, `the left column goes top to bottom: ${left[i - 1].label} then ${left[i].label}`);
  // Every kind of control shows a focus ring.
  await click("#product-name");
  const rings = await ev(`(()=>{const out={};const pick={input:"#product-name",radio:'input[name=stack]:checked',segment:'[role=group][aria-label=File] button',download:".tool-btn--primary",choose:'section[aria-label="Import a previous file"] button',tab:"[role=tab]"};for(const [k,s] of Object.entries(pick)){const e=document.querySelector(s);e.focus({focusVisible:true});const c=getComputedStyle(e);out[k]=c.outlineStyle!=="none"&&parseFloat(c.outlineWidth)>=2}return out})()`);
  await key("Tab");
  const after = await ev(`(()=>{const e=document.activeElement;const c=getComputedStyle(e);return c.outlineStyle!=="none"&&parseFloat(c.outlineWidth)>=2})()`);
  assert.equal(after, true, "Tab moves focus to something with a visible ring");
  for (const [k, v] of Object.entries(rings)) assert.equal(v, true, `${k} shows a focus ring`);
});

// ---------------------------------------------------------------------------------------------- contrast and chrome

const CONTRAST = `
(() => {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rgba = (css) => { ctx.clearRect(0,0,1,1); ctx.fillStyle = "#000"; ctx.fillStyle = css; ctx.fillRect(0,0,1,1); const d = ctx.getImageData(0,0,1,1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const lum = ([r,g,b]) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const over = (top, bottom) => top[3] >= 1 ? top : [0,1,2].map((i) => top[i]*top[3] + bottom[i]*(1-top[3])).concat(1);
  const bgOf = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); if (c[3] > 0) stack.push(c); if (c[3] >= 1) break; } let out = [255,255,255,1]; for (const c of stack.reverse()) out = over(c, out); return out; };
  const textRatio = (el, pseudo) => ratio(over(rgba(getComputedStyle(el, pseudo).color), bgOf(el)), bgOf(el));
  return { rgba, ratio, over, bgOf, textRatio };
})()
`;
const checks = () => `
(() => {
  const C = ${CONTRAST};
  const out = [];
  const text = (name, el, pseudo) => { if (!el) { out.push({ name, missing: true }); return; } out.push({ name, kind: "text", ratio: C.textRatio(el, pseudo) }); };
  const q = (s) => document.querySelector(s);
  text("page title", q("h1"));
  text("page subtitle", q("h1 + p"));
  text("card title", q("section[aria-label='Your product'] h2"));
  text("card description", q("section[aria-label='Your product'] h2 + p"));
  text("label", q("label[for=product-name]"));
  text("input text", q("#product-name"));
  text("input placeholder", q("#product-name"), "::placeholder");
  text("radio label", q("fieldset label span span"));
  text("radio help", q("fieldset label span > span:last-child"));
  text("recommended chip", q("fieldset label .rounded-full"));
  text("segmented selected", q("[role=group][aria-label=File] button[aria-pressed=true]"));
  text("segmented other", q("[role=group][aria-label=File] button[aria-pressed=false]"));
  text("download button", q(".tool-btn--primary"));
  text("copy button", [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Copy file")));
  text("choose file button", q("section[aria-label='Import a previous file'] button"));
  text("import hint", q("[data-import-file]"));
  text("meter label", q("[data-size-state] span"));
  text("meter value", q("[data-size-state] .tabular-nums"));
  text("meter message", q("[data-size-state] p"));
  text("tab selected", q("[role=tab][aria-selected=true]"));
  text("tab other", q("[role=tab][aria-selected=false]"));
  text("file info", q("[data-file-info]"));
  text("inside label", q("[aria-label='What is inside'] span"));
  text("inside chip", q("[aria-label='What is inside'] span + span"));
  text("document paragraph", q(".export-sheet p"));
  text("document heading", q(".export-sheet [role=heading]"));
  text("document code", q(".export-sheet code"));
  text("install title", q("#install-title"));
  text("install card text", q("#install-title").closest("section").querySelector("li"));
  text("install small print", q("#install-title").closest("section").querySelector("p.text-xs"));
  text("top bar import", [...document.querySelectorAll("header button")].find((b) => b.textContent.includes("Import")));
  text("back to editing", [...document.querySelectorAll("header a")].find((b) => b.textContent.includes("Back")));
  // Borders of controls and focus rings need 3:1 against what they sit on.
  const border = (name, el) => { const cs = getComputedStyle(el); const edge = C.over(C.rgba(cs.borderTopColor), C.bgOf(el.parentElement)); out.push({ name, kind: "ui", ratio: C.ratio(edge, C.bgOf(el.parentElement)) }); };
  border("name input border", q("#product-name"));
  border("line input border", q("#product-line"));
  const ring = (name, el) => { el.focus({ focusVisible: true }); const cs = getComputedStyle(el); out.push({ name, kind: "ui", ratio: C.ratio(C.rgba(cs.outlineColor), C.bgOf(el.parentElement)) }); };
  ring("input focus ring", q("#product-name"));
  ring("button focus ring", q(".tool-btn--primary"));
  ring("tab focus ring", q("[role=tab]"));
  return out;
})()
`;

for (const theme of ["light", "dark"]) {
  test(`contrast in ${theme} mode: text 4.5:1, control borders and focus rings 3:1`, async () => {
    await fresh("/app/export", theme);
    assert.equal(await ev(`document.querySelector(".tool").classList.contains("dark")`), theme === "dark");
    // Show a status message too, so its colors are measured.
    await importPath(tmpFile(`bad-${theme}.md`, ""));
    const results = await ev(checks());
    const bad = results.filter((r) => r.missing || (r.kind === "text" && r.ratio < 4.5) || (r.kind === "ui" && r.ratio < 3));
    assert.deepEqual(bad.map((r) => `${r.name}: ${r.missing ? "missing" : r.ratio.toFixed(2)}`), [], `${theme}: every pair reaches its ratio`);
    // The import message (error), and a success message.
    const status = await ev(`(()=>{const C=${CONTRAST};const p=document.querySelector("section[aria-label='Import a previous file'] [role=status] p");return C.textRatio(p)})()`);
    assert.ok(status >= 4.5, `${theme}: the failure message is ${status.toFixed(2)}:1`);
    await importPath(tmpFile(`good-${theme}.md`, block({ project: { name: "Acme" } })));
    const good = await ev(`(()=>{const C=${CONTRAST};const p=document.querySelector("section[aria-label='Import a previous file'] [role=status] p");return C.textRatio(p)})()`);
    assert.ok(good >= 4.5, `${theme}: the success message is ${good.toFixed(2)}:1`);
    // The warning and error meter messages in this mode (set up through an import).
    await importPath(tmpFile(`over-${theme}.md`, block({ project: { name: NAME60, description: DESC200, stack: "html-css" }, colors: { secondary: "#9243CD", brand: "#E54848" }, typography: OWN_FONTS })));
    const over = await ev(`(()=>{const C=${CONTRAST};return C.textRatio(document.querySelector("[data-size-state] [role=alert]"))})()`);
    assert.ok(over >= 4.5, `${theme}: the over limit message is ${over.toFixed(2)}:1`);
    await importPath(tmpFile(`near-${theme}.md`, block({ project: { name: "Acme Billing Platform for Teams".slice(0, 30), description: DESC200.slice(0, 100), stack: "html-css" }, colors: { secondary: "#9243CD" } })));
    const near = await ev(`(()=>{const C=${CONTRAST};return C.textRatio(document.querySelector("[data-size-state] p.flex"))})()`);
    assert.ok(near >= 4.5, `${theme}: the close to the limit message is ${near.toFixed(2)}:1`);
  });
}

test("the tool's own chrome colors stay identical across five brands, light and dark, on the Export screen", async () => {
  const brands = ["#4F46E5", "#E54848", "#FACC15", "#0F766E", "#111827"];
  for (const theme of ["light", "dark"]) {
    await fresh("/app/export", theme);
    const read = () => ev(`(()=>{const t=document.querySelector(".tool");const c=getComputedStyle(t);const e=getComputedStyle(document.querySelector(".tool-btn--primary"));const h=getComputedStyle(document.querySelector("header"));const card=getComputedStyle(document.querySelector("section[aria-label=Download]"));return JSON.stringify(["--primary","--card","--border","--foreground","--background","--ring","--muted","--secondary","--input","--t-surface"].map(v=>c.getPropertyValue(v).trim()).concat(e.backgroundColor,h.backgroundColor,card.backgroundColor,card.borderTopColor))})()`);
    const baseline = await read();
    for (const brand of brands) {
      await importPath(tmpFile(`brand-${brand.slice(1)}.md`, block({ colors: { brand } })));
      assert.equal(await read(), baseline, `${theme}: the chrome is identical with ${brand}`);
    }
  }
});
