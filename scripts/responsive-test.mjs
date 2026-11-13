/**
 * Responsive and Export polish tests, in a real headless Chrome with real input (mouse, keyboard, touch). No extra packages.
 *
 *   npm run test:live        runs this file together with the other live tests
 *   LIVE_URL=http://localhost:3001 node --test scripts/responsive-test.mjs
 *
 * Widths: 1920, 1440, 1280, 1024, 768 and 390. Below 1280 the tool stacks; below 768 it compacts.
 */

import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9900 + Math.floor(Math.random() * 90);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WIDTHS = [1920, 1440, 1280, 1024, 768, 390];
const SYSTEM_IDS = ["colors", "typography", "radius", "spacing", "borders", "shadows", "buttons", "signature", "voice"];
let baseUrl = process.env.LIVE_URL ?? "http://localhost:3000";
let server = null;
let chrome = null;
let ws = null;
let nextId = 0;
const pending = new Map();
const work = mkdtempSync(join(tmpdir(), "responsive-test-"));

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
const setWidth = async (width, height = 900) => {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  await sleep(450);
};
/** Clean state, chosen theme, an optional open editor, then the page. */
async function fresh(path, { theme = "light", editor = null } = {}) {
  await send("Page.navigate", { url: baseUrl + "/favicon.ico" });
  await sleep(400);
  await ev(`localStorage.clear();sessionStorage.clear();localStorage.setItem("design-sys-md:tool-theme","${theme}");${editor ? `sessionStorage.setItem("design-sys-md:open-editor","${editor}")` : ""}`);
  await send("Page.navigate", { url: baseUrl + path });
  await sleep(2400);
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
const CODES = { Enter: 13, ArrowDown: 40, ArrowUp: 38, Home: 36, End: 35, Tab: 9, Escape: 27, " ": 32 };
async function key(k) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code: k === " " ? "Space" : k, windowsVirtualKeyCode: CODES[k], text: k === "Enter" ? "\r" : k === " " ? " " : undefined });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: k === " " ? "Space" : k, windowsVirtualKeyCode: CODES[k] });
  await sleep(200);
}
const touch = (type, x, y) => send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
async function tap(selector) {
  const p = await ev(rectOf(selector));
  assert.ok(p, `element not found: ${selector}`);
  await touch("touchStart", p.x, p.y);
  await sleep(60);
  await touch("touchEnd", p.x, p.y);
  await sleep(300);
}
const tmpFile = (name, content) => {
  const path = join(work, name);
  writeFileSync(path, content);
  return path;
};
async function importPath(path) {
  const r = await send("Runtime.evaluate", { expression: `document.querySelector('input[type=file]')` });
  await send("DOM.setFileInputFiles", { files: [path], objectId: r.result.objectId });
  await sleep(700);
}
const block = (settings) => "# X\n\n```json\n" + JSON.stringify({ format: "design-sys-md", version: 3, preset: "saas-clean", presetVersion: 4, settings }) + "\n```\n";

/** Page level sideways scroll, plus any visible element that sticks out of the window without a scroll container of its own. */
const OVERFLOW = `
(() => {
  const win = innerWidth;
  const clipped = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip") { const r = p.getBoundingClientRect(); if (r.right <= win + 1) return true; } } return false; };
  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || getComputedStyle(el).position === "fixed") continue;
    if ((r.right > win + 1 || r.left < -1) && !clipped(el)) out.push((el.tagName + "." + String(el.className).slice(0, 40)).slice(0, 70) + " " + Math.round(r.left) + ".." + Math.round(r.right));
  }
  return { doc: document.documentElement.scrollWidth, body: document.body.scrollWidth, win, sticking: out.slice(0, 5) };
})()
`;
async function assertNoSidewaysScroll(label) {
  const m = await ev(OVERFLOW);
  assert.ok(m.doc <= m.win && m.body <= m.win, `${label}: the page is ${m.doc}px wide in a ${m.win}px window`);
  assert.deepEqual(m.sticking, [], `${label}: elements stick out of the window`);
}

before(async () => {
  if (!process.env.LIVE_URL && !(await reachable(baseUrl))) {
    baseUrl = "http://localhost:3125";
    server = spawn("npx", ["next", "start", "-p", "3125"], { stdio: "ignore" });
    for (let i = 0; i < 40 && !(await reachable(baseUrl + "/app")); i++) await sleep(500);
  }
  assert.ok(await reachable(baseUrl + "/app/export"), `no server at ${baseUrl}`);
  chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, "--disable-gpu", "--window-size=1440,1000", `--user-data-dir=${mkdtempSync(join(tmpdir(), "resp-chrome-"))}`, "about:blank"], { stdio: "ignore" });
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
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  await setWidth(1440);
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

// ---------------------------------------------------------------------------------------------- no sideways scroll

test("no horizontal page scroll on the board, with every preview tab, at all six widths", async () => {
  await fresh("/app");
  const tabs = await ev(`[...document.querySelectorAll('[aria-label="Preview pages"] [role=tab]')].map(t=>t.textContent.trim())`);
  assert.equal(tabs.length, 6);
  for (const width of WIDTHS) {
    await setWidth(width);
    for (let i = 0; i < tabs.length; i++) {
      await click(`document.querySelectorAll('[aria-label="Preview pages"] [role=tab]')[${i}]`);
      await ev(`window.scrollTo(0,0)`);
      await assertNoSidewaysScroll(`board, ${tabs[i]} tab, ${width}px`);
    }
  }
});

test("no horizontal page scroll in any of the nine editors at all six widths", async () => {
  for (const editor of SYSTEM_IDS) {
    await fresh("/app", { editor });
    for (const width of WIDTHS) {
      await setWidth(width);
      assert.equal(await ev(`!!document.querySelector("section[aria-labelledby=editor-title]")`), true, `${editor} is open at ${width}`);
      await assertNoSidewaysScroll(`${editor} editor, ${width}px`);
    }
  }
});

test("no horizontal page scroll on the Export view, light and dark, rendered and raw, at all six widths", async () => {
  for (const theme of ["light", "dark"]) {
    await fresh("/app/export", { theme });
    for (const view of [0, 1]) {
      await click(`document.querySelectorAll('[role=tablist][aria-label="File view"] [role=tab]')[${view}]`);
      for (const width of WIDTHS) {
        await setWidth(width);
        await assertNoSidewaysScroll(`export ${view ? "raw" : "rendered"}, ${theme}, ${width}px`);
      }
    }
  }
});

test("long lines (a 200 character product line without spaces) never cause sideways scroll; code scrolls inside its own block", async () => {
  await fresh("/app/export");
  await importPath(tmpFile("long.md", block({ project: { name: "N".repeat(60), description: "W".repeat(200), stack: "html-css" } })));
  for (const theme of ["light", "dark"]) {
    await ev(`localStorage.setItem("design-sys-md:tool-theme","${theme}")`);
    await send("Page.reload");
    await sleep(2400);
    for (const width of [1920, 1280, 768, 390]) {
      await setWidth(width);
      await click(`document.querySelectorAll('[role=tablist][aria-label="File view"] [role=tab]')[0]`);
      await assertNoSidewaysScroll(`long lines rendered, ${theme}, ${width}px`);
      const sheet = await ev(`(()=>{const s=document.querySelector(".export-sheet");return {scroll:s.scrollWidth,client:s.clientWidth,hasLong:s.textContent.includes("W".repeat(200))}})()`);
      assert.equal(sheet.hasLong, true, "the long line is in the file");
      assert.ok(sheet.scroll <= sheet.client + 1, `${theme} ${width}: the sheet does not clip long text (${sheet.scroll} > ${sheet.client})`);
      // Code blocks either fit or scroll inside themselves.
      const pres = await ev(`[...document.querySelectorAll(".export-sheet pre")].map(p=>({fits:p.scrollWidth<=p.clientWidth+1,scrolls:["auto","scroll"].includes(getComputedStyle(p).overflowX)}))`);
      for (const pre of pres) assert.ok(pre.fits || pre.scrolls, `${theme} ${width}: a code block neither fits nor scrolls`);
      await click(`document.querySelectorAll('[role=tablist][aria-label="File view"] [role=tab]')[1]`);
      await assertNoSidewaysScroll(`long lines raw, ${theme}, ${width}px`);
      const raw = await ev(`(()=>{const p=document.querySelector("[role=tabpanel] pre");return {scroll:p.scrollWidth,client:p.clientWidth}})()`);
      assert.ok(raw.scroll <= raw.client + 1, `${theme} ${width}: raw text wraps (${raw.scroll} > ${raw.client})`);
    }
  }
});

// ---------------------------------------------------------------------------------------------- Part 1: Export polish

test("ordered lists leave room for two digit numbers (10 to 15) inside the text edge", async () => {
  await fresh("/app/export");
  const m = await ev(`(()=>{
    const ol=[...document.querySelectorAll(".export-sheet ol")].find(o=>o.children.length>=12);
    if(!ol) return null;
    const li=ol.children[0];const cs=getComputedStyle(li);
    const ctx=document.createElement("canvas").getContext("2d");ctx.font=cs.font;
    return {items:ol.children.length,padding:parseFloat(getComputedStyle(ol).paddingLeft),marker:ctx.measureText("15. ").width,markerStyle:getComputedStyle(ol).listStylePosition}
  })()`);
  assert.ok(m, "the Hard rules list has at least 12 items");
  assert.ok(m.padding >= m.marker, `the list padding (${m.padding}px) holds the widest marker (${m.marker.toFixed(1)}px)`);
  // The real position of the marker box: the first text line starts at the padding edge; markers are drawn left of it, inside the ol box.
  const edge = await ev(`(()=>{const ol=[...document.querySelectorAll(".export-sheet ol")].find(o=>o.children.length>=12);const r=document.createRange();r.selectNodeContents(ol.children[11]);const t=r.getBoundingClientRect().left;return {text:t,ol:ol.getBoundingClientRect().left}})()`);
  assert.ok(edge.text - edge.ol >= m.marker, `item 12 text starts ${(edge.text - edge.ol).toFixed(1)}px inside the list; its marker needs ${m.marker.toFixed(1)}px`);
});

for (const theme of ["light", "dark"]) {
  test(`the bottom fade is inside the sheet, exactly as wide, and fades to its own white (${theme}, 1280, 1440, 1920)`, async () => {
    await fresh("/app/export", { theme });
    for (const width of [1280, 1440, 1920]) {
      await setWidth(width);
      await click(`document.querySelectorAll('[role=tablist][aria-label="File view"] [role=tab]')[0]`);
      const m = await ev(`(()=>{
        const panel=document.querySelector("[role=tabpanel]");const sheet=panel.querySelector(".export-sheet");const fade=sheet.querySelector(".export-fade");
        const s=sheet.getBoundingClientRect(), f=fade.getBoundingClientRect(), p=panel.getBoundingClientRect();
        const bg=getComputedStyle(sheet).backgroundColor, grad=getComputedStyle(fade).backgroundImage;
        return {insideSheet:fade.parentElement===sheet, left:Math.abs(f.left-s.left), width:Math.abs(f.width-s.width), bottomInPanel:f.bottom<=p.bottom+0.5, panelFades:panel.querySelectorAll(".export-fade").length, outside:document.querySelectorAll(".export-fade").length, bg, grad, scrollbar:p.width-panel.clientWidth, sheetRight:s.right, panelRight:p.right-(p.width-panel.clientWidth)}
      })()`);
      assert.equal(m.insideSheet, true, `${width}: the fade is a child of the sheet`);
      assert.equal(m.outside, 1, `${width}: only one fade exists, and none outside the sheet`);
      assert.ok(m.left <= 0.5 && m.width <= 0.5, `${width}: the fade matches the sheet's left edge (${m.left}) and width (${m.width})`);
      assert.equal(m.bottomInPanel, true, `${width}: the fade stays inside the scroll area`);
      assert.match(m.grad, /rgb\(255, 255, 255\)/, `${width}: it fades to white (${m.grad})`);
      assert.equal(m.bg, "rgb(255, 255, 255)", `${width}: the sheet is white`);
      assert.ok(m.sheetRight <= m.panelRight + 0.5, `${width}: the sheet and its fade stay left of the scrollbar`);
      // At the end of the scroll the last line is not under the fade.
      await ev(`(()=>{const p=document.querySelector("[role=tabpanel]");p.scrollTop=p.scrollHeight})()`);
      await sleep(200);
      const end = await ev(`(()=>{const sheet=document.querySelector(".export-sheet");const fade=sheet.querySelector(".export-fade").getBoundingClientRect();const last=[...sheet.children].filter(c=>!c.hasAttribute("aria-hidden")).pop().getBoundingClientRect();return {lastBottom:last.bottom,fadeTop:fade.top}})()`);
      assert.ok(end.lastBottom <= end.fadeTop + 1, `${width}: at the end the last line (${end.lastBottom}) sits above the fade (${end.fadeTop})`);
    }
  });
}

test("under the Download buttons both sizes show, and both come from the real generated files for each stack", async () => {
  await fresh("/app/export");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await click(`input[name=stack][value=next-tailwind-shadcn]`);
  const read = async (stack) => {
    await click(`input[name=stack][value="${stack}"]`);
    await click(`document.querySelectorAll('[role=tablist][aria-label="File view"] [role=tab]')[1]`);
    const bytes = async (label) => {
      await click(`[...document.querySelectorAll("button")].find(b=>b.textContent.trim().startsWith(${JSON.stringify(label)}))`);
      return ev(`new TextEncoder().encode(document.querySelector("[role=tabpanel] pre").textContent).length`);
    };
    const skill = await bytes("SKILL.md, Claude Code");
    const agents = await bytes("AGENTS.md, Codex");
    const shown = await ev(`({line:document.querySelector("[data-skill-size]").textContent.replace(/\\s+/g," ").trim(),meter:document.querySelector("[data-size-state] .tabular-nums").textContent})`);
    return { skill, agents, ...shown };
  };
  const seen = new Set();
  for (const stack of ["next-tailwind-shadcn", "react-tailwind", "html-css"]) {
    const m = await read(stack);
    assert.equal(m.line, `SKILL.md ${(m.skill / 1024).toFixed(1)} KiB. Claude Code has no size limit for skills.`, `${stack}: the SKILL.md line`);
    assert.equal(m.meter, `${(m.agents / 1024).toFixed(1)} of 32 KiB`, `${stack}: the Codex meter`);
    seen.add(m.line);
  }
  assert.equal(seen.size, 3, "the number changes with the stack");
  // The product inputs change it too.
  const before = (await read("html-css")).line;
  await click(`#product-line`);
  await send("Input.insertText", { text: "A longer product line that adds a few hundred bytes. ".repeat(3) });
  await sleep(300);
  const after = (await read("html-css")).line;
  assert.notEqual(after, before, "the number follows the product line");
});

// ---------------------------------------------------------------------------------------------- Part 2: layout

test("1280 and wider keeps two columns; below 1280 the board, editor and Export view stack in the right order", async () => {
  const boxes = (selectors) => ev(`(${JSON.stringify(selectors)}).map(s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();return {top:b.top+scrollY,bottom:b.bottom+scrollY,left:b.left,right:b.right,width:b.width}})`);
  // Board.
  await fresh("/app");
  const BOARD = ['div.grid[class*="grid-cols"]', 'section[aria-label="Live preview"]'];
  for (const width of WIDTHS) {
    await setWidth(width);
    const [board, preview] = await boxes(BOARD);
    if (width >= 1280) {
      assert.ok(preview.left >= board.right - 1, `${width}: the preview sits right of the board`);
      assert.ok(Math.abs(board.top - preview.top) < 4, `${width}: both start at the same height`);
      assert.ok(Math.abs(board.width - 560) < 2, `${width}: the board is 560px wide (${board.width})`);
    } else {
      assert.ok(preview.top >= board.bottom - 1, `${width}: the preview is below the board`);
      assert.ok(board.width > (width - 80) * 0.95, `${width}: the board is full width (${board.width})`);
    }
  }
  // 768 to 1279 keep three columns with 120px rows; below 768 two columns.
  await setWidth(1024);
  assert.equal(await ev(`getComputedStyle(document.querySelector('div.grid[class*="grid-cols"]')).gridTemplateColumns.split(" ").length`), 3);
  assert.equal(await ev(`getComputedStyle(document.querySelector('div.grid[class*="grid-cols"]')).gridAutoRows`), "120px");
  await setWidth(768);
  assert.equal(await ev(`getComputedStyle(document.querySelector('div.grid[class*="grid-cols"]')).gridTemplateColumns.split(" ").length`), 3);
  await setWidth(390);
  assert.equal(await ev(`getComputedStyle(document.querySelector('div.grid[class*="grid-cols"]')).gridTemplateColumns.split(" ").length`), 2);
  const wide = await ev(`[...document.querySelectorAll('div.grid[class*="grid-cols"] > *')].map(t=>({label:(t.querySelector("span.truncate")||t).textContent.trim().slice(0,12),w:Math.round(t.getBoundingClientRect().width)}))`);
  const full = Math.max(...wide.map((t) => t.w));
  for (const name of ["Colors", "Shadows", "Buttons", "Signature", "Tone"]) assert.equal(wide.find((t) => t.label.startsWith(name))?.w, full, `${name} spans both columns at 390`);
  // Tile order is the reading order (focus order matches what you see).
  const order = await ev(`[...document.querySelectorAll('div.grid[class*="grid-cols"] > *')].map(t=>t.getBoundingClientRect().top+scrollY)`);
  for (let i = 1; i < order.length; i++) assert.ok(order[i] >= order[i - 1] - 1, `tile ${i + 1} is not above tile ${i} at 390`);

  // Editor.
  await fresh("/app", { editor: "colors" });
  const EDIT = ['nav[aria-label="Design systems"]', "section[aria-labelledby=editor-title]", 'section[aria-label="Live preview"]'];
  for (const width of WIDTHS) {
    await setWidth(width);
    const [nav, panel, preview] = await boxes(EDIT);
    if (width >= 1280) {
      assert.ok(Math.abs(nav.width - 224) < 2 && Math.abs(panel.width - 400) < 2, `${width}: list 224px and panel 400px (${nav.width}, ${panel.width})`);
      assert.ok(panel.left >= nav.right - 1 && preview.left >= panel.right - 1, `${width}: list, panel and preview in a row`);
    } else {
      assert.ok(panel.top >= nav.bottom - 1 && preview.top >= panel.bottom - 1, `${width}: list, then panel, then preview`);
      assert.ok(panel.width > (width - 80) * 0.95, `${width}: the editor panel is full width (${panel.width})`);
      const chips = await ev(`(()=>{const n=document.querySelector('nav[aria-label="Design systems"]');const items=[...n.querySelectorAll("button")].map(b=>b.getBoundingClientRect());return {row:new Set(items.map(r=>Math.round(r.top))).size,scrolls:getComputedStyle(n).overflowX}})()`);
      assert.equal(chips.row, 1, `${width}: the system list is one row of chips`);
      assert.equal(chips.scrolls, "auto", `${width}: the row scrolls sideways when it must`);
    }
  }
  // At 390 the row really overflows and the open chip is scrolled into view.
  await setWidth(390);
  assert.equal(await ev(`(()=>{const n=document.querySelector('nav[aria-label="Design systems"]');return n.scrollWidth>n.clientWidth})()`), true);
  await ev(`(()=>{const n=document.querySelector('nav[aria-label="Design systems"]');n.querySelectorAll("button")[5].click()})()`);
  await sleep(500);
  assert.equal(await ev(`(()=>{const n=document.querySelector('nav[aria-label="Design systems"]');const c=n.querySelector('[aria-current="true"]').getBoundingClientRect(),r=n.getBoundingClientRect();return c.left>=r.left-1&&c.right<=r.right+1})()`), true, "the open chip is in view");

  // Export.
  await fresh("/app/export");
  const EXP = ["section[aria-label='Your product']", "section[aria-label=Download]", "section[aria-label='Import a previous file']", "section[aria-label='File preview']", "#install-title"];
  for (const width of WIDTHS) {
    await setWidth(width);
    const [product, download, imp, file, install] = await boxes(EXP);
    if (width >= 1280) {
      assert.ok(file.left >= product.right - 1, `${width}: the file preview is right of the cards`);
      assert.ok(Math.abs(product.width - 480) < 2, `${width}: the left column is 480px (${product.width})`);
    } else {
      assert.ok(download.top >= product.bottom - 1 && imp.top >= download.bottom - 1 && file.top >= imp.bottom - 1 && install.top >= file.bottom - 1, `${width}: product, download, import, file, install in this order`);
      const maxHeight = await ev(`document.querySelector("section[aria-label='File preview']").getBoundingClientRect().height <= innerHeight * 0.7 + 1 || document.querySelector("section[aria-label='File preview']").getBoundingClientRect().height <= 420`);
      assert.equal(maxHeight, true, `${width}: the file preview is at most 70% of the window high`);
      assert.equal(await ev(`getComputedStyle(document.querySelector("#install-title").closest("section").querySelector(".grid")).gridTemplateColumns.split(" ").length`), 1, `${width}: install cards in one column`);
    }
  }
  await setWidth(1280);
  assert.equal(await ev(`getComputedStyle(document.querySelector("#install-title").closest("section").querySelector(".grid")).gridTemplateColumns.split(" ").length`), 3);
});

test("browser zoom of 200 percent at 1280 reflows to the stacked layout", async () => {
  await fresh("/app");
  // 200% zoom of a 1280px window is a 640 CSS pixel wide viewport at twice the pixel density.
  await send("Emulation.setDeviceMetricsOverride", { width: 640, height: 450, deviceScaleFactor: 2, mobile: false });
  await sleep(500);
  for (const [path, a, b] of [["/app", 'div.grid[class*="grid-cols"]', 'section[aria-label="Live preview"]'], ["/app/export", "section[aria-label='Download']", "section[aria-label='File preview']"]]) {
    if (path !== "/app") await fresh(path);
    await send("Emulation.setDeviceMetricsOverride", { width: 640, height: 450, deviceScaleFactor: 2, mobile: false });
    await sleep(500);
    const m = await ev(`(()=>{const x=document.querySelector(${JSON.stringify(a)}).getBoundingClientRect(),y=document.querySelector(${JSON.stringify(b)}).getBoundingClientRect();return {stacked:y.top>=x.bottom-1,doc:document.documentElement.scrollWidth,win:innerWidth}})()`);
    assert.equal(m.stacked, true, `${path}: stacked at 200% zoom`);
    assert.ok(m.doc <= m.win, `${path}: no sideways scroll at 200% zoom`);
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
});

// ---------------------------------------------------------------------------------------------- compact top bar and the More menu

const visible = (selector) => `(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0})()`;
const activeLabel = () => ev(`(()=>{const a=document.activeElement;return a?(a.getAttribute("aria-label")||a.textContent.trim()).slice(0,30):""})()`);

test("the top bar shows everything from 768 up and compacts below 768 to the logo, Export and a More menu", async () => {
  await fresh("/app");
  for (const width of [1920, 1440, 1280, 1024, 768]) {
    await setWidth(width);
    assert.equal(await ev(`(()=>{const h=document.querySelector("header");const t=[...h.querySelectorAll("button,a")].filter(e=>e.getBoundingClientRect().width>0).map(e=>(e.getAttribute("aria-label")||e.textContent).trim());return t.join("|")})()`), "SaaS Clean|Blank slate|Import file|Switch to dark mode|Export file", `${width}: logo, preset switch, Import, theme toggle and Export`);
    assert.equal(await ev(`(()=>{const r=document.querySelector("header > div").getBoundingClientRect();return r.height<=72})()`), true, `${width}: the bar is one row`);
  }
  await setWidth(390);
  assert.equal(await ev(`(()=>{const h=document.querySelector("header");return [...h.querySelectorAll("button,a")].filter(e=>e.getBoundingClientRect().width>0).map(e=>(e.getAttribute("aria-label")||e.textContent).trim()).join("|")})()`), "Export file|More");
  assert.equal(await ev(`(()=>{const r=document.querySelector("header > div").getBoundingClientRect();return r.height<=72})()`), true, "390: the bar is one row");
  // On the Export screen the compact bar offers Back to editing instead.
  await fresh("/app/export");
  await setWidth(390);
  assert.equal(await ev(`(()=>{const h=document.querySelector("header");return [...h.querySelectorAll("button,a")].filter(e=>e.getBoundingClientRect().width>0).map(e=>(e.getAttribute("aria-label")||e.textContent).trim()).join("|")})()`), "Back to editing|More");
});

test("the More menu opens by keyboard, moves with the arrows, closes on Escape and Tab, and returns focus", async () => {
  await fresh("/app");
  await setWidth(390);
  const button = `document.querySelector('header button[aria-haspopup="menu"]')`;
  assert.equal(await ev(`${button}.getAttribute("aria-expanded")`), "false");
  assert.equal(await ev(`!!document.querySelector("[role=menu]")`), false);
  await ev(`${button}.focus()`);
  await key("Enter");
  assert.equal(await ev(`${button}.getAttribute("aria-expanded")`), "true");
  assert.equal(await ev(`${button}.getAttribute("aria-controls")===document.querySelector("[role=menu]").id`), true);
  const items = await ev(`[...document.querySelectorAll("[role=menu] [role^=menuitem]")].map(i=>({role:i.getAttribute("role"),text:i.textContent.trim(),checked:i.getAttribute("aria-checked"),h:Math.round(i.getBoundingClientRect().height)}))`);
  assert.deepEqual(items.map((i) => i.text), ["SaaS Clean", "Blank slate", "Import file", "Switch to dark mode"]);
  assert.equal(items[0].checked, "true", "the current preset is checked");
  for (const item of items) assert.ok(item.h >= 44, `${item.text} is ${item.h}px high`);
  assert.equal(await activeLabel(), "SaaS Clean", "focus moves into the menu, onto the checked preset");
  await key("ArrowDown");
  assert.equal(await activeLabel(), "Blank slate");
  await key("End");
  assert.equal(await activeLabel(), "Switch to dark mode");
  await key("ArrowDown");
  assert.equal(await activeLabel(), "SaaS Clean", "the arrows wrap around");
  await key("ArrowUp");
  assert.equal(await activeLabel(), "Switch to dark mode");
  await key("Home");
  assert.equal(await activeLabel(), "SaaS Clean");
  // Escape closes and returns focus.
  await key("Escape");
  assert.equal(await ev(`!!document.querySelector("[role=menu]")`), false, "Escape closes the menu");
  assert.equal(await ev(`document.activeElement===${button}`), true, "and focus returns to More");
  assert.equal(await ev(`${button}.getAttribute("aria-expanded")`), "false");
  // ArrowDown on the button opens it too; Tab closes it without trapping focus.
  await key("ArrowDown");
  assert.equal(await ev(`!!document.querySelector("[role=menu]")`), true);
  await key("Tab");
  assert.equal(await ev(`!!document.querySelector("[role=menu]")`), false, "Tab closes the menu");
  // Choosing a preset applies it, closes the menu and returns focus.
  await ev(`${button}.focus()`);
  await key("Enter");
  await key("ArrowDown");
  await key("Enter");
  assert.equal(await ev(`!!document.querySelector("[role=menu]")`), false);
  assert.equal(await ev(`document.activeElement===${button}`), true);
  await key("Enter");
  assert.equal(await ev(`document.querySelector("[role=menu] [aria-checked=true]").textContent.trim()`), "Blank slate", "the preset changed");
  await key("Escape");
  // The theme item toggles the tool's light and dark.
  await key("Enter");
  await key("End");
  await key("Enter");
  assert.equal(await ev(`document.querySelector(".tool").classList.contains("dark")`), true, "the theme item switches to dark");
  assert.equal(await ev(`document.activeElement===${button}`), true);
  // A click outside closes it.
  await click(button);
  assert.equal(await ev(`!!document.querySelector("[role=menu]")`), true);
  await click(`h1`);
  assert.equal(await ev(`!!document.querySelector("[role=menu]")`), false, "a click outside closes the menu");
  // At 768 the menu does not exist.
  await setWidth(768);
  assert.equal(await ev(visible('header button[aria-haspopup="menu"]')), false);
});

test("the More menu sits inside the window and is readable in dark mode at 390", async () => {
  await fresh("/app", { theme: "dark" });
  await setWidth(390);
  await click(`header button[aria-haspopup="menu"]`);
  const m = await ev(`(()=>{const r=document.querySelector("[role=menu]").getBoundingClientRect();const cs=getComputedStyle(document.querySelector("[role=menu]"));return {l:r.left,r:r.right,b:r.bottom,win:innerWidth,bg:cs.backgroundColor}})()`);
  assert.ok(m.l >= 0 && m.r <= m.win, "inside the window");
  assert.notEqual(m.bg, "rgba(0, 0, 0, 0)");
});

// ---------------------------------------------------------------------------------------------- touch targets

const TARGETS = `
(() => {
  const small = [];
  const skip = (e) => e.closest('[aria-label="Live preview"] [role=tabpanel]') || e.closest(".sr-only") || e.matches('input[type=radio],input[type=checkbox],input[type=file],input[type=range]');
  for (const e of document.querySelectorAll('button, a[href], [role=tab], [role=menuitem], [role=menuitemradio], summary, input:not([type=radio]):not([type=checkbox]):not([type=file]):not([type=range]), select')) {
    const r = e.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || skip(e)) continue;
    if (r.height < 43.5) small.push((e.getAttribute("aria-label") || e.textContent || e.tagName).trim().slice(0, 30) + " " + Math.round(r.width) + "x" + Math.round(r.height));
  }
  return small;
})()
`;

test("below 768 every button, link, tab and field in the tool chrome is at least 44px high (board, nine editors, Export, More menu)", async () => {
  await fresh("/app");
  await setWidth(390);
  assert.deepEqual(await ev(TARGETS), [], "board");
  await click(`header button[aria-haspopup="menu"]`);
  assert.deepEqual(await ev(TARGETS), [], "More menu open");
  await key("Escape");
  for (const editor of SYSTEM_IDS) {
    await fresh("/app", { editor });
    await setWidth(390);
    assert.deepEqual(await ev(TARGETS), [], `${editor} editor`);
  }
  await fresh("/app/export");
  await setWidth(390);
  assert.deepEqual(await ev(TARGETS), [], "export view");
  await importPath(tmpFile("empty.md", ""));
  assert.deepEqual(await ev(TARGETS), [], "export view with an import message");
  await fresh("/app");
  await importPath(tmpFile("ok.md", block({ project: { name: "Acme" } })));
  await setWidth(390);
  assert.deepEqual(await ev(TARGETS), [], "board with the import banner");
});

// ---------------------------------------------------------------------------------------------- Roles by touch at 390

const EDITOR = `document.querySelector("section[aria-labelledby=editor-title]")`;
const swatch = (id) => `${EDITOR}.querySelector('[data-tray] [data-swatch="${id}"]')`;
const roleRow = (key) => `${EDITOR}.querySelector('[data-role-row="${key}"]')`;
const centerOf = (selector) => `(()=>{const e=${selector};const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`;
const roleText = (key) => ev(`${roleRow(key)}.innerText`);
const rolesView = async () => {
  await ev(`document.getElementById("roles-title").scrollIntoView({block:"start"})`);
  await sleep(300);
};

test("Roles at 390: a touch drag applies a swatch to a role without scrolling the page, and tap to pick up works", async () => {
  await fresh("/app", { editor: "colors" });
  await setWidth(390, 844);
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  try {
    await rolesView();
    assert.equal(await ev(`getComputedStyle(${swatch("neutral-700")}).touchAction`), "none", "a swatch takes over touch, so the page does not scroll under the finger");
    const swatchSize = await ev(`(()=>{const r=${swatch("neutral-700")}.getBoundingClientRect();return {h:Math.round(r.height)}})()`);
    assert.ok(swatchSize.h >= 44, `a tray swatch is ${swatchSize.h}px high`);
    // Drag.
    const from = await ev(centerOf(swatch("neutral-700")));
    const to = await ev(centerOf(roleRow("primary")));
    assert.ok(to.y < 844 && from.y < 844, `the swatch (${from.y}) and the Primary row (${to.y}) are both on screen`);
    const scrollBefore = await ev(`({page:scrollY,panel:${EDITOR}.querySelector("[data-role-scroll]").scrollTop})`);
    await touch("touchStart", from.x, from.y);
    for (let i = 1; i <= 10; i++) await touch("touchMove", from.x + ((to.x - from.x) * i) / 10, from.y + ((to.y - from.y) * i) / 10);
    await sleep(150);
    assert.equal(await ev(`!!document.querySelector(".tool-float")`), true, "a floating copy follows the finger");
    assert.equal(await ev(`${roleRow("primary")}.dataset.over`), "true", "the row under the finger lights up");
    const during = await ev(`({page:scrollY,panel:${EDITOR}.querySelector("[data-role-scroll]").scrollTop})`);
    assert.equal(during.page, scrollBefore.page, "the page did not scroll while the finger dragged");
    assert.ok(Math.abs(during.panel - scrollBefore.panel) < 40, "the panel did not scroll while the finger dragged");
    await touch("touchEnd", to.x, to.y);
    await sleep(400);
    assert.match(await roleText("primary"), /neutral 700/, "the touch drop applied");
    // A second drag onto another role also works.
    await rolesView();
    await ev(`${roleRow("foreground")}.scrollIntoView({block:"center"})`);
    await sleep(300);
    const from2 = await ev(centerOf(swatch("neutral-800")));
    const to2 = await ev(centerOf(roleRow("foreground")));
    await touch("touchStart", from2.x, from2.y);
    for (let i = 1; i <= 10; i++) await touch("touchMove", from2.x + ((to2.x - from2.x) * i) / 10, from2.y + ((to2.y - from2.y) * i) / 10);
    await touch("touchEnd", to2.x, to2.y);
    await sleep(400);
    assert.match(await roleText("foreground"), /neutral 800/);

    // Tap to pick up: tap a swatch, then tap a role.
    await rolesView();
    await tap(swatch("neutral-600"));
    assert.match(await ev(`document.querySelector("[data-tray-bar]").textContent`), /^Holding neutral 600\. Click a role to use it\./);
    await tap(`${roleRow("border")}.querySelector(".truncate")`);
    assert.match(await roleText("border"), /neutral 600/, "tap to pick up applied the swatch");
    assert.match(await ev(`document.querySelector("[data-tray-bar]").textContent`), /^Drag onto a role, or click then click a role/, "nothing is held any more");
  } finally {
    await send("Emulation.setTouchEmulationEnabled", { enabled: false });
    await setWidth(1440);
  }
});

test("Roles at 390: dragging near the bottom edge of the panel scrolls the panel, not the page", async () => {
  await fresh("/app", { editor: "colors" });
  await setWidth(390, 844);
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  try {
    await rolesView();
    const from = await ev(centerOf(swatch("brand-700")));
    const box = await ev(`(()=>{const b=${EDITOR}.querySelector("[data-role-scroll]").getBoundingClientRect();return {bottom:Math.min(b.bottom,innerHeight)}})()`);
    const before = await ev(`({page:scrollY,panel:${EDITOR}.querySelector("[data-role-scroll]").scrollTop})`);
    await touch("touchStart", from.x, from.y);
    for (let i = 1; i <= 8; i++) await touch("touchMove", from.x, from.y + ((box.bottom - 12 - from.y) * i) / 8);
    await sleep(1000);
    const during = await ev(`({page:scrollY,panel:${EDITOR}.querySelector("[data-role-scroll]").scrollTop})`);
    await touch("touchEnd", from.x, box.bottom - 12);
    await sleep(300);
    assert.ok(during.panel - before.panel > 40, `the panel scrolled while dragging (${before.panel} to ${during.panel})`);
    assert.equal(during.page, before.page, "the page itself did not scroll");
  } finally {
    await send("Emulation.setTouchEmulationEnabled", { enabled: false });
    await setWidth(1440);
  }
});

test("the tool's own chrome colors stay identical across widths", async () => {
  await fresh("/app");
  const read = () => ev(`(()=>{const c=getComputedStyle(document.querySelector(".tool"));return JSON.stringify(["--primary","--card","--border","--foreground","--background","--ring"].map(v=>c.getPropertyValue(v).trim()))})()`);
  await setWidth(1440);
  const base = await read();
  for (const width of WIDTHS) {
    await setWidth(width);
    assert.equal(await read(), base, `${width}`);
  }
});

