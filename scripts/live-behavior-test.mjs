/**
 * Live behavior tests for /app, run in a real headless Chrome (no extra packages: it talks to Chrome over the
 * DevTools protocol with Node's built in WebSocket).
 *
 *   npm run test:live                      uses a running server at http://localhost:3000, or starts `next start`
 *                                          on port 3123 (run `npm run build` first)
 *   LIVE_URL=http://localhost:3001 npm run test:live
 *
 * What is checked: the spinner rotates (and reduced motion swaps it for a static indicator), the border beam
 * animates (and has its reduced motion fallback), tabs switch, checkbox / radio / switch toggle, inputs take
 * typing, the select takes focus, segmented controls change state, hover changes the computed style of buttons,
 * tabs, tiles and list items, dark mode toggles, and Back, Previous, Next and Reset work.
 */

import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9400 + Math.floor(Math.random() * 400);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let baseUrl = process.env.LIVE_URL ?? "http://localhost:3000";
let server = null;
let chrome = null;
let ws = null;
let nextId = 0;
const pending = new Map();

async function reachable(url) {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(2000) })).ok;
  } catch {
    return false;
  }
}

const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

/** Runs an expression in the page and returns its value (errors become test failures). */
async function ev(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(`Page error: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}\n${expression}`);
  return r.result?.value;
}

async function open(path = "/app", { reduced = false } = {}) {
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reduced ? "reduce" : "no-preference" }] });
  await send("Page.navigate", { url: baseUrl + path });
  await sleep(2600);
}

/** Starts from a clean browser state (no saved work), then opens the app. */
async function fresh(options) {
  await send("Page.navigate", { url: baseUrl + "/favicon.ico" });
  await sleep(500);
  await ev(`localStorage.clear()`);
  await open("/app", options);
}

const rect = (selector) => `(()=>{const e=${selector};if(!e)return null;e.scrollIntoView({block:"center",inline:"center"});const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2,w:b.width,h:b.height}})()`;

/** A real mouse click at the center of an element (so mousedown, focus and click all behave as for a person). */
async function click(selector) {
  const p = await ev(rect(selector));
  assert.ok(p, `element not found: ${selector}`);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: p.x, y: p.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: p.x, y: p.y, button: "left", clickCount: 1 });
  await sleep(350);
}

/** Computed style before and after the pointer moves onto an element. */
async function hover(selector, props) {
  const read = `(()=>{const e=${selector};const c=getComputedStyle(e);return ${JSON.stringify(props)}.map(p=>c[p])})()`;
  const p = await ev(rect(selector));
  assert.ok(p, `element not found: ${selector}`);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 });
  await sleep(350);
  const before = await ev(read);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y });
  await sleep(450);
  const after = await ev(read);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 });
  return { before, after, changed: JSON.stringify(before) !== JSON.stringify(after) };
}

const byText = (css, text) => `[...document.querySelectorAll(${JSON.stringify(css)})].find(e=>e.textContent.trim().startsWith(${JSON.stringify(text)}))`;
const tabButton = (name) => byText("[role=tab]", name);
const goTab = async (name) => {
  await click(tabButton(name));
  await sleep(500);
};
const PANEL = `document.querySelector("[role=tabpanel]")`;

before(async () => {
  if (!process.env.LIVE_URL && !(await reachable(baseUrl))) {
    baseUrl = "http://localhost:3123";
    server = spawn("npx", ["next", "start", "-p", "3123"], { stdio: "ignore" });
    for (let i = 0; i < 40 && !(await reachable(baseUrl + "/app")); i++) await sleep(500);
  }
  assert.ok(await reachable(baseUrl + "/app"), `no server at ${baseUrl}`);
  chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, "--disable-gpu", "--window-size=1440,900", `--user-data-dir=${mkdtempSync(join(tmpdir(), "live-test-"))}`, "about:blank"], { stdio: "ignore" });
  let target = null;
  for (let i = 0; i < 30 && !target; i++) {
    await sleep(300);
    try {
      target = (await (await fetch(`http://localhost:${PORT}/json`)).json()).find((t) => t.type === "page");
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
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
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

// ---------------------------------------------------------------------------------------------- animation

test("loading spinners rotate (reduced motion off)", async () => {
  await fresh();
  await goTab("Buttons and states");
  const info = await ev(`(()=>{const s=[...document.querySelectorAll(".pvx-spin")];return {count:s.length,name:getComputedStyle(s[0]).animationName,visible:getComputedStyle(s[0]).display}})()`);
  assert.equal(info.count, 4, "four loading buttons, four spinners");
  assert.equal(info.name, "pvx-spin", "the spinner has its rotation animation");
  const first = await ev(`getComputedStyle(document.querySelector(".pvx-spin")).transform`);
  await sleep(230);
  const second = await ev(`getComputedStyle(document.querySelector(".pvx-spin")).transform`);
  assert.notEqual(first, second, "the spinner turned between two moments");
});

test("reduced motion replaces the spinner with a static indicator", async () => {
  await fresh({ reduced: true });
  await goTab("Buttons and states");
  const info = await ev(`(()=>{const s=document.querySelector(".pvx-spin"),t=document.querySelector(".pvx-spin-static");return {spin:getComputedStyle(s).display,anim:getComputedStyle(s).animationName,still:t?getComputedStyle(t).display:null}})()`);
  assert.equal(info.spin, "none", "the rotating spinner is hidden");
  assert.notEqual(info.still, null, "a static indicator exists");
  assert.notEqual(info.still, "none", "the static indicator is shown");
});

test("the border beam animates, and has a steady fallback under reduced motion", async () => {
  await fresh();
  await goTab("Pricing");
  const on = await ev(`(()=>{const b=document.querySelector("[role=tabpanel] .cta");const c=getComputedStyle(b,"::before");return {found:!!b,name:c.animationName,duration:c.animationDuration}})()`);
  assert.equal(on.found, true, "the recommended button carries the cta class");
  assert.equal(on.name, "ds-beam");
  assert.equal(on.duration, "3.6s");
  const a1 = await ev(`getComputedStyle(document.querySelector("[role=tabpanel] .cta"),"::before").backgroundImage`);
  await sleep(400);
  const a2 = await ev(`getComputedStyle(document.querySelector("[role=tabpanel] .cta"),"::before").backgroundImage`);
  assert.notEqual(a1, a2, "the light moved around the ring");

  await open("/app", { reduced: true });
  const off = await ev(`(()=>{const c=getComputedStyle(document.querySelector("[role=tabpanel] .cta"),"::before");return {name:c.animationName,image:c.backgroundImage,color:c.backgroundColor}})()`);
  assert.equal(off.name, "none", "no animation under reduced motion");
  assert.equal(off.image, "none", "a steady ring color instead of the moving gradient");
  assert.notEqual(off.color, "rgba(0, 0, 0, 0)");
});

// ---------------------------------------------------------------------------------------------- tabs and controls

test("the six preview tabs switch", async () => {
  await fresh();
  const markers = { Pricing: "Simple pricing", "Buttons and states": "Loading", Forms: "Profile", Tables: "Team members", Dashboard: "Recent activity", Charts: "Chart colors" };
  for (const [name, marker] of Object.entries(markers)) {
    await goTab(name);
    const state = await ev(`(()=>{const t=${tabButton(name)};return {selected:t.getAttribute("aria-selected"),text:${PANEL}.innerText}})()`);
    assert.equal(state.selected, "true", `${name} is selected`);
    assert.ok(state.text.includes(marker), `${name} shows "${marker}"`);
  }
});

test("checkbox, radio and switch toggle; the input takes typing; the select takes focus", async () => {
  await fresh();
  await goTab("Forms");
  const box = `${PANEL}.querySelector("input[type=checkbox]")`;
  const was = await ev(`${box}.checked`);
  await click(box);
  assert.equal(await ev(`${box}.checked`), !was, "checkbox toggled");

  const radio = `${PANEL}.querySelectorAll("input[type=radio]")[1]`;
  await click(radio);
  assert.equal(await ev(`${radio}.checked`), true, "radio picked");
  assert.equal(await ev(`${PANEL}.querySelectorAll("input[type=radio]")[0].checked`), false, "the other radio cleared");

  const sw = `${PANEL}.querySelector("[role=switch]")`;
  const on = await ev(`${sw}.getAttribute("aria-checked")`);
  await click(sw);
  assert.notEqual(await ev(`${sw}.getAttribute("aria-checked")`), on, "switch flipped");

  const input = `${PANEL}.querySelector("#pv-name")`;
  await click(input);
  assert.equal(await ev(`document.activeElement===${input}`), true, "clicking the input focuses it");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "a", code: "KeyA", text: "!" });
  await send("Input.insertText", { text: "xyz" });
  assert.ok((await ev(`${input}.value`)).includes("xyz"), "typing changes the value");

  const select = `${PANEL}.querySelector("select")`;
  await click(select);
  assert.equal(await ev(`document.activeElement===${select}`), true, "clicking the select focuses it (so it can open)");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
});

test("a mouse click on a button does not leave a focus ring, but the keyboard does", async () => {
  await fresh();
  await goTab("Forms");
  const save = `${PANEL}.querySelector("button[type=submit]")`;
  await click(save);
  assert.equal(await ev(`${save}.matches(":focus-visible")`), false, "no focus ring after a mouse click");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  assert.equal(await ev(`document.activeElement!==document.body&&document.activeElement.matches(":focus-visible")`), true, "Tab moves focus and shows the ring");
});

test("segmented controls change state: preset, neutral tone, date range", async () => {
  await fresh();
  const preset = `document.querySelector("[role=group][aria-label*=reset]")`;
  await click(`${preset}.querySelectorAll("button")[1]`);
  assert.equal(await ev(`${preset}.querySelectorAll("button")[1].getAttribute("aria-pressed")`), "true", "Blank slate is selected");
  assert.ok((await ev(`document.body.innerText`)).includes("#404040"), "the board shows the Blank slate brand color");
  await click(`${preset}.querySelectorAll("button")[0]`);

  await click(`document.querySelector('button[aria-label^="Colors"]')`);
  const tone = `document.querySelector("[role=group][aria-label='Neutral tone']")`;
  await click(`${tone}.querySelectorAll("button")[1]`);
  assert.equal(await ev(`${tone}.querySelectorAll("button")[1].getAttribute("aria-pressed")`), "true", "Warm is selected");
  assert.equal(await ev(`${tone}.querySelectorAll("button")[0].getAttribute("aria-pressed")`), "false");

  await goTab("Dashboard");
  const range = `${PANEL}.querySelector("[role=group][aria-label='Date range']")`;
  await click(`${range}.querySelectorAll("button")[0]`);
  assert.equal(await ev(`${range}.querySelectorAll("button")[0].getAttribute("aria-pressed")`), "true", "7 days is selected");
  assert.equal(await ev(`${range}.querySelectorAll("button")[1].getAttribute("aria-pressed")`), "false");
});

// ---------------------------------------------------------------------------------------------- hover and focus

test("hover changes the computed style of a button, a tab, a tile, a list item and the top bar buttons", async () => {
  await fresh();
  const misses = [];
  const check = async (name, selector, props) => {
    const result = await hover(selector, props);
    if (!result.changed) misses.push(`${name} ${JSON.stringify(result.after)}`);
  };
  await check("tile", `document.querySelector('button[aria-label^="Radius"]')`, ["transform", "boxShadow"]);
  await check("preview tab", tabButton("Forms"), ["color"]);
  await check("theme toggle", `document.querySelector("button[aria-label*='mode']")`, ["backgroundColor", "opacity"]);
  await check("Export file", byText("a", "Export file"), ["backgroundColor", "opacity"]);
  await check("Import file", byText("a", "Import file"), ["color", "backgroundColor"]);
  await check("preset segment", `document.querySelector("[role=group][aria-label*=reset]").querySelectorAll("button")[1]`, ["color"]);
  await goTab("Forms");
  await check("Save changes button", `${PANEL}.querySelector("button[type=submit]")`, ["backgroundColor"]);
  await click(`document.querySelector('button[aria-label^="Colors"]')`);
  await check("list item", `document.querySelectorAll("nav[aria-label='Design systems'] button")[2]`, ["transform", "boxShadow"]);
  await check("Next button", byText("button", "Next"), ["backgroundColor", "opacity"]);
  await check("Back to board", byText("button", "Back to board"), ["color", "backgroundColor"]);
  assert.deepEqual(misses, [], `no hover change for: ${misses.join("; ")}`);
});

test("pricing cards lift on hover", async () => {
  await fresh();
  await goTab("Pricing");
  const card = await hover(`document.querySelector("[role=tabpanel] .card-hover")`, ["transform", "boxShadow"]);
  assert.ok(card.changed, `card hover lift: ${JSON.stringify(card)}`);
});

test("keyboard focus shows a ring on tiles, tabs and list items", async () => {
  await fresh();
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Shift", code: "ShiftLeft", windowsVirtualKeyCode: 16 });
  const ring = (selector) => `(()=>{const e=${selector};e.focus();const c=getComputedStyle(e);return c.outlineStyle!=="none"&&parseFloat(c.outlineWidth)>=2})()`;
  assert.equal(await ev(ring(`document.querySelector('button[aria-label^="Colors"]')`)), true, "tile");
  assert.equal(await ev(ring(tabButton("Forms"))), true, "tab");
  await click(`document.querySelector('button[aria-label^="Colors"]')`);
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Shift", code: "ShiftLeft", windowsVirtualKeyCode: 16 });
  assert.equal(await ev(ring(`document.querySelectorAll("nav[aria-label='Design systems'] button")[1]`)), true, "list item");
});

// ---------------------------------------------------------------------------------------------- app flows

test("dark mode toggles, and Back, Next, Previous, reviewed ticks and Reset work", async () => {
  await fresh();
  const toggle = `document.querySelector("button[aria-label*='mode']")`;
  assert.equal(await ev(`document.querySelector(".tool").classList.contains("dark")`), false);
  await click(toggle);
  assert.equal(await ev(`document.querySelector(".tool").classList.contains("dark")`), true, "dark on");
  await click(toggle);
  assert.equal(await ev(`document.querySelector(".tool").classList.contains("dark")`), false, "dark off");

  await click(`document.querySelector('button[aria-label^="Colors"]')`);
  assert.equal(await ev(`document.getElementById("editor-title").textContent`), "Colors", "tile opens its editor");
  await click(byText("button", "Next"));
  assert.equal(await ev(`document.getElementById("editor-title").textContent`), "Typography", "Next goes forward");
  assert.equal(await ev(`document.querySelectorAll("nav[aria-label='Design systems'] [aria-label=Reviewed]").length`), 1, "Colors is ticked as reviewed");
  await click(byText("button", "Previous"));
  assert.equal(await ev(`document.getElementById("editor-title").textContent`), "Colors", "Previous goes back");
  await click(byText("button", "Back to board"));
  assert.equal(await ev(`!!document.getElementById("editor-title")`), false, "Back to board closes the editor");
  assert.ok((await ev(`document.body.innerText`)).includes("1 of 9 reviewed"), "progress counts the review");

  await click(`document.querySelector('button[aria-label^="Colors"]')`);
  await click(`[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Back to board")`);
  assert.equal(await ev(`!!document.getElementById("editor-title")`), false, "the link above the list also goes back");

  // An edit shows Reset, and Reset clears it.
  const preset = `document.querySelector("[role=group][aria-label*=reset]")`;
  await click(`${preset}.querySelectorAll("button")[1]`);
  await click(`${preset}.querySelectorAll("button")[0]`);
  await click(`document.querySelector('button[aria-label^="Colors"]')`);
  await ev(`(()=>{const i=document.querySelector("input[aria-label='Brand color hex code']");const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;set.call(i,"#0D9488");i.dispatchEvent(new Event("input",{bubbles:true}))})()`);
  await sleep(500);
  assert.ok((await ev(`document.body.innerText`)).includes("edited"), "edited label appears");
  await click(byText("button", "Reset to"));
  assert.ok(!(await ev(`document.body.innerText`)).includes("edited"), "Reset clears the edit");
  assert.equal(await ev(`${byText("a", "Import file")}.getAttribute("href")`), "/debug#export", "Import file link");
});

// ---------------------------------------------------------------------------------------------- layout and samples

const setBrand = async (hex) => {
  await ev(`(()=>{const i=document.querySelector("input[aria-label='Brand color hex code']");const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;set.call(i,${JSON.stringify(hex)});i.dispatchEvent(new Event("input",{bubbles:true}))})()`);
  await sleep(600);
};
const openEditor = async (name = "Colors") => click(`document.querySelector('button[aria-label^="${name}"]')`);

test("the Buttons grid sizes to its content: no collisions with the red brand or a long label, and the focus ring has room", async () => {
  await fresh();
  await openEditor();
  await setBrand("#E54848");
  await goTab("Buttons and states");
  const measure = `(()=>{
    const wrap=${PANEL}.querySelector(".pvx-matrix-wrap");const buttons=[...wrap.querySelectorAll(".btn")];
    const rows={};buttons.forEach(b=>{const r=b.getBoundingClientRect();(rows[Math.round(r.top)]??=[]).push(r)});
    let minGap=1e9,overlap=false;Object.values(rows).forEach(list=>{list.sort((a,b)=>a.left-b.left);for(let i=1;i<list.length;i++){const gap=list[i].left-list[i-1].right;minGap=Math.min(minGap,gap);if(gap<0)overlap=true}});
    const w=wrap.getBoundingClientRect();const f=wrap.querySelector(".is-focus").getBoundingClientRect();
    return {minGap,overlap,focusRoom:Math.min(f.left-w.left,w.right-f.right,f.top-w.top,w.bottom-f.bottom),trash:!!wrap.querySelector("svg")}})()`;
  let m = await ev(measure);
  assert.equal(m.overlap, false, "no two buttons overlap");
  assert.ok(m.minGap >= 11.5, `at least a 12px gap (${m.minGap})`);
  assert.ok(m.focusRoom >= 4, `room for the 2px ring with its 2px offset (${m.focusRoom})`);
  // A long label: every column grows to fit it.
  await ev(`${PANEL}.querySelectorAll(".pvx-matrix .btn--destructive").forEach(b=>{b.lastChild.textContent="Delete everything permanently"})`);
  await sleep(300);
  m = await ev(measure);
  assert.equal(m.overlap, false, "no overlap with a long label");
  assert.ok(m.minGap >= 11.5, `gap kept with a long label (${m.minGap})`);
});

test("brand swatches are focusable buttons with labels, a tooltip row, copy, and a visible step 600 marker (also near black)", async () => {
  await fresh();
  const tile = `document.querySelector('button[aria-label^="Colors"]').parentElement`;
  const swatches = `${tile}.querySelectorAll("button.tool-swatch")`;
  assert.equal(await ev(`${swatches}.length`), 10, "ten swatch buttons in the Colors tile");
  assert.equal(await ev(`${swatches}[0].getAttribute("aria-label")`), "Brand 50, #F4F6FF");
  assert.equal(await ev(`${swatches}[6].getAttribute("aria-label")`), "Brand 600, #4F46E5, your color");
  assert.equal(await ev(`${swatches}[6].getAttribute("aria-current")`), "true");
  // Keyboard focus shows the tooltip, in a reserved row that holds nothing else.
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Shift", code: "ShiftLeft", windowsVirtualKeyCode: 16 });
  await ev(`${swatches}[2].focus()`);
  await sleep(200);
  const tip = await ev(`(()=>{const t=document.querySelector(".tool-tip");return t?{text:t.textContent,onlyChild:t.parentElement.children.length===1,hidden:t.parentElement.getAttribute("aria-hidden")}:null})()`);
  assert.ok(tip, "tooltip shows on keyboard focus");
  assert.match(tip.text, /200 · #CAD2FF/);
  assert.equal(tip.onlyChild, true, "the tooltip row holds no other text");
  // Clicking copies and says so.
  await click(`${swatches}[2]`);
  assert.equal(await ev(`document.querySelector(".tool-tip")?.textContent`), "Copied");

  // The step 600 ring is visible on a near black brand (two tone) and a white brand.
  for (const brand of ["#111827", "#FFFFFF", "#FACC15"]) {
    await openEditor();
    await setBrand(brand);
    const ring = await ev(`(()=>{const e=document.querySelector("section[aria-labelledby=editor-title] button.tool-swatch[aria-current=true]");const c=getComputedStyle(e);return {shadow:c.boxShadow,label:e.getAttribute("aria-label")}})()`);
    assert.match(ring.shadow, /0px 0px 0px 2px[\s\S]*0px 0px 0px 4px/, `two tone ring on ${brand}`);
    assert.match(ring.label, /your color/);
    await click(byText("button", "Back to board"));
  }
});

test("the header lines up with the page at 1280, 1440 and 1920", async () => {
  await fresh();
  try {
    for (const width of [1280, 1440, 1920]) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
      await sleep(500);
      const m = await ev(`(()=>{const l=document.querySelector("header span[aria-hidden]").getBoundingClientRect().left;const h=document.querySelector("h1").getBoundingClientRect().left;const e=[...document.querySelectorAll("header a")].find(a=>a.textContent.includes("Export")).getBoundingClientRect().right;const p=document.querySelector("[role=status] span[aria-hidden]").getBoundingClientRect().right;return {l,h,e,p}})()`);
      assert.ok(Math.abs(m.l - m.h) < 1.5, `${width}: logo left ${m.l} vs title left ${m.h}`);
      assert.ok(Math.abs(m.e - m.p) < 1.5, `${width}: Export right ${m.e} vs progress right ${m.p}`);
    }
  } finally {
    await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  }
});

test("Dashboard and Charts: the donut center shows the top segment, the date axis follows the range, the cards match, and a tab click leaves no ring", async () => {
  await fresh();
  await goTab("Dashboard");
  const range = `${PANEL}.querySelector("[role=group][aria-label='Date range']")`;
  const axis = () => ev(`[...${PANEL}.querySelectorAll("figure svg text.pvx-axis")].map(t=>t.textContent).filter(t=>/[A-Za-z]/.test(t)&&!/^\\d/.test(t)).slice(0,12)`);
  await click(`${range}.querySelectorAll("button")[1]`);
  const days30 = await axis();
  assert.ok(days30.some((t) => /^[A-Z][a-z]{2} \d{1,2}$/.test(t)), `30 days shows dates: ${days30}`);
  await click(`${range}.querySelectorAll("button")[0]`);
  const days7 = await axis();
  assert.ok(days7.some((t) => /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/.test(t)), `7 days shows weekdays: ${days7}`);

  await goTab("Charts");
  const donut = await ev(`${PANEL}.querySelector(".pvx-donut svg").textContent`);
  assert.ok(donut.includes("40%") && donut.includes("Email") && !donut.includes("100%"), `donut center: ${donut}`);
  const h = await ev(`(()=>{const d=${PANEL}.querySelector(".pvx-donut").closest(".card").getBoundingClientRect().height;const s=${PANEL}.querySelector(".pvx-statcard").getBoundingClientRect().height;return [d,s]})()`);
  assert.ok(Math.abs(h[0] - h[1]) < 1.5, `sparkline card ${h[1]} equals donut card ${h[0]}`);

  await click(tabButton("Forms"));
  const ring = await ev(`(()=>{const t=${tabButton("Forms")};const c=getComputedStyle(t);return {fv:t.matches(":focus-visible"),outline:c.outlineStyle}})()`);
  assert.equal(ring.fv, false, "a mouse click on a tab is not focus-visible");
  assert.equal(ring.outline, "none", "and shows no outline");
});

test("the Pricing tab is drawn with the skill file's classes", async () => {
  await fresh();
  await goTab("Pricing");
  const info = await ev(`(()=>{const q=s=>${PANEL}.querySelectorAll(s).length;return {plans:q(".plans > .card.card-hover.plan"),featured:q(".card-featured"),cta:q(".btn--primary.cta"),tiles:q(".icon-tile"),dividers:q(".divider"),border:getComputedStyle(${PANEL}.querySelector(".card-featured")).borderTopWidth}})()`);
  assert.deepEqual({ ...info }, { plans: 3, featured: 1, cta: 1, tiles: 3, dividers: 3, border: "2px" });
});

test("the Buttons and inputs, Signature and Shadows tile samples sit on an inset panel (also in dark mode)", async () => {
  await fresh();
  const check = () => ev(`(()=>{const out={};for(const name of ["Buttons and inputs","Signature details","Shadows"]){const t=document.querySelector('button[aria-label^="'+name+'"]');const p=t.querySelector(".tool-sample-outline");const r=p.getBoundingClientRect(),tr=t.getBoundingClientRect();out[name]={radius:getComputedStyle(p).borderRadius,pad:getComputedStyle(p).padding,inset:r.width<tr.width-32,fits:r.bottom<=tr.bottom-16+0.5}}return out})()`);
  for (const dark of [false, true]) {
    if (dark) await click(`document.querySelector("button[aria-label*='mode']")`);
    const result = await check();
    for (const [name, v] of Object.entries(result)) {
      assert.equal(v.radius, "10px", `${name} panel radius`);
      assert.equal(v.pad, "8px", `${name} panel padding`);
      assert.ok(v.fits, `${name} panel stays inside the tile`);
    }
  }
  await ev(`localStorage.removeItem("design-sys-md:tool-theme")`);
});
