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
  assert.match(tip.text, /Click to copy #CAD2FF/);
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

// ---------------------------------------------------------------------------------------------- roles (drag and drop)

const EDITOR = `document.querySelector("section[aria-labelledby=editor-title]")`;
const swatch = (id) => `${EDITOR}.querySelector('[data-tray] [data-swatch="${id}"]')`;
const roleRow = (key) => `${EDITOR}.querySelector('[data-role-row="${key}"]')`;
const centerOf = (selector) => `(()=>{const e=${selector};const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`;
const rolesView = async () => {
  await ev(`document.getElementById("roles-title").scrollIntoView({block:"start"})`);
  await sleep(250);
};
const mouse = (type, x, y) => send("Input.dispatchMouseEvent", { type, x, y, button: type === "mouseMoved" ? "none" : "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1 });

/**
 * Presses on a source and drags to a role row the way a person would: if the row is below the visible part of the panel
 * the pointer rests near the bottom edge (auto scroll) until the row comes into view. Returns the state over the row.
 */
async function dragSwatch(sourceId, roleKey, { release = true } = {}) {
  await rolesView();
  const from = await ev(centerOf(swatch(sourceId)));
  const area = await ev(`(()=>{const b=${EDITOR}.querySelector("[data-role-scroll]").getBoundingClientRect();return {top:b.top,bottom:b.bottom,x:b.x+b.width/2}})()`);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: from.x, y: from.y });
  await mouse("mousePressed", from.x, from.y);
  const moveTo = async (x, y) => send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, buttons: 1 });
  const inView = async () => ev(`(()=>{const r=${roleRow(roleKey)}.getBoundingClientRect();const tb=document.querySelector("[data-tray]").getBoundingClientRect().bottom;return r.top>Math.max(${area.top},tb)+8&&r.bottom<${area.bottom}-2})()`);
  let x = from.x;
  for (let i = 1; i <= 4; i++) await moveTo(from.x + (area.x - from.x) * (i / 4), from.y + 6 * i);
  x = area.x;
  for (let guard = 0; guard < 40 && !(await inView()); guard++) {
    const row = await ev(`(()=>{const r=${roleRow(roleKey)}.getBoundingClientRect();return {top:r.top,bottom:r.bottom}})()`);
    // Rest near the bottom edge to scroll down, near the top edge to scroll up.
    const trayBottom = await ev(`document.querySelector("[data-tray]").getBoundingClientRect().bottom`);
    await moveTo(x, row.bottom > area.bottom - 2 ? area.bottom - 20 : Math.max(area.top, trayBottom) + 14);
    await sleep(120);
  }
  // Leave the edge zone so the scrolling stops, then aim at where the row really is.
  await moveTo(x, (area.top + area.bottom) / 2);
  await sleep(200);
  const to = await ev(centerOf(roleRow(roleKey)));
  const mid0 = (area.top + area.bottom) / 2;
  for (let i = 1; i <= 6; i++) await moveTo(x + ((to.x - x) * i) / 6, mid0 + ((to.y - mid0) * i) / 6);
  await sleep(150);
  const mid = await ev(`(()=>{const r=${roleRow(roleKey)};const f=document.querySelector(".tool-float");return {over:r.dataset.over,text:r.innerText,float:f?f.innerText:null}})()`);
  if (release) {
    await mouse("mouseReleased", to.x, to.y);
    await sleep(350);
  }
  return mid;
}
const findButton = (rowKey, text) => `[...${roleRow(rowKey)}.querySelectorAll("button")].find(b=>b.textContent.trim()==="${text}")`;
const hoverRow = async (key) => {
  const p = await ev(centerOf(roleRow(key)));
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y });
  await sleep(250);
  return ev(`({outline:getComputedStyle(${roleRow(key)}).outlineStyle})`);
};
const roleText = (key) => ev(`${roleRow(key)}.innerText`);
const toolColors = () =>
  ev(`(()=>{const t=document.querySelector(".tool");const c=getComputedStyle(t);const exp=[...document.querySelectorAll("header a")].find(a=>a.textContent.includes("Export"));return JSON.stringify(["--primary","--card","--border","--foreground","--ring","--muted","--secondary"].map(v=>c.getPropertyValue(v).trim()).concat(getComputedStyle(exp).backgroundColor,getComputedStyle(document.querySelector("header")).backgroundColor))})()`);

test("roles: a pointer drop applies, shows the drop target and the floating swatch, and the tool's own colors do not change", async () => {
  await fresh();
  await openEditor();
  const before = await toolColors();
  await rolesView();
  const mid = await dragSwatch("neutral-700", "muted-foreground");
  assert.equal(mid.over, "true", "the row is the drop target " + JSON.stringify(mid));
  assert.match(mid.text, /Drop to use neutral 700/);
  assert.equal(mid.float, "neutral 700", "a floating copy follows the pointer");
  const text = await roleText("muted-foreground");
  assert.match(text, /Custom/);
  assert.match(text, /neutral 700, #3C4046/);
  assert.match(text, /passes/);
  assert.equal(await ev(`${roleRow("muted-foreground")}.dataset.over`), undefined, "the drop target clears");
  // The preview follows.
  await goTab("Forms");
  const muted = await ev(`getComputedStyle(${PANEL}.querySelector(".field__help:not(.field__help--error)")).color`);
  assert.equal(muted, "rgb(60, 64, 70)", "the preview uses the new muted text color");
  assert.equal(await toolColors(), before, "the tool's own colors are identical");
  // Changing a role counts as reviewing Colors.
  await click(byText("button", "Back to board"));
  assert.ok((await ev(`document.body.innerText`)).includes("1 of 9 reviewed"), "a role change counts as reviewing Colors");
});

test("roles: a drop that breaks a rule is rejected with the numbers and a suggestion, and the suggestion applies", async () => {
  await fresh();
  await openEditor();
  await rolesView();
  // Brand 300 as Text is far below AA. Dragged from the neutral bank's neighbour, brand scale, via the picker flow below;
  // here a neutral 300 swatch is dropped on Text.
  const before = await roleText("foreground");
  await dragSwatch("neutral-300", "foreground");
  const after = await roleText("foreground");
  assert.match(after, /Neutral 300 on white is 1\.\d\d:1, below AA \(4\.5:1\)\. Closest passing step: neutral 600\./);
  assert.match(after, /neutral 900, #14171C/, "the old value is kept");
  assert.ok(!/Custom/.test(after), "nothing was applied");
  assert.ok(before.includes("neutral 900"));
  assert.equal(await ev(`${roleRow("foreground")}.querySelector("[role=alert], #role-msg-foreground")!==null`), true);
  // The preview is untouched too.
  // "Use neutral 600" applies the closest passing step.
  await click(findButton("foreground", "Use neutral 600"));
  const applied = await roleText("foreground");
  assert.match(applied, /Custom/);
  assert.match(applied, /neutral 600/);
  assert.ok(!/below AA/.test(applied), "the message is gone");
});

test("roles: Primary needs readable button text, Input border and Focus ring need 3:1", async () => {
  await fresh();
  await openEditor();
  await rolesView();
  await dragSwatch("neutral-200", "input");
  assert.match(await roleText("input"), /Neutral 200 on white is [\d.]+:1, below the 3:1 minimum\. Closest passing step: neutral 500\./);
  await dragSwatch("neutral-300", "ring");
  assert.match(await roleText("ring"), /below the 3:1 minimum/);
  // A mid gray fails for button text in one of the two directions only if neither white nor dark reaches 4.5; an accepted one stays accepted.
  await dragSwatch("neutral-900", "primary");
  assert.match(await roleText("primary"), /Custom/);
});

test("roles: the keyboard picker (Change) chooses with arrows and Enter, closes with Escape, and returns focus", async () => {
  await fresh();
  await openEditor();
  await rolesView();
  const change = `${roleRow("primary")}.querySelector('button[aria-label="Change Primary"]')`;
  const key = async (k, code = k) => {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, text: k === "Enter" ? "\r" : undefined, windowsVirtualKeyCode: { Enter: 13, Escape: 27, ArrowRight: 39, ArrowLeft: 37, ArrowDown: 40, ArrowUp: 38, " ": 32 }[k] ?? 0 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: { Enter: 13, Escape: 27, ArrowRight: 39, ArrowLeft: 37, ArrowDown: 40, ArrowUp: 38, " ": 32 }[k] ?? 0 });
    await sleep(120);
  };
  await ev(`${change}.focus()`);
  await key("Enter");
  assert.equal(await ev(`!!${roleRow("primary")}.querySelector("[role=dialog]")`), true, "the picker opens");
  assert.equal(await ev(`document.activeElement.getAttribute("aria-label")`), "Brand 600, #4F46E5", "focus starts on the current color");
  await key("ArrowRight");
  assert.equal(await ev(`document.activeElement.getAttribute("aria-label")`), "Brand 700, #3830BF");
  await key("ArrowDown");
  assert.match(await ev(`document.activeElement.getAttribute("aria-label")`), /^Neutral 700/);
  await key("ArrowUp");
  await key("Enter");
  assert.equal(await ev(`!!${roleRow("primary")}.querySelector("[role=dialog]")`), false, "choosing closes the picker");
  assert.equal(await ev(`document.activeElement===${change}`), true, "focus returns to the Change button");
  assert.match(await roleText("primary"), /brand 700, #3830BF/);
  // Escape closes without changing anything.
  await key("Enter");
  await key("ArrowRight");
  await key("Escape");
  assert.equal(await ev(`!!${roleRow("primary")}.querySelector("[role=dialog]")`), false);
  assert.equal(await ev(`document.activeElement===${change}`), true, "focus returns after Escape");
  assert.match(await roleText("primary"), /brand 700/, "Escape changed nothing");
  // A rejected choice through the picker shows the message too.
  const textChange = `${roleRow("foreground")}.querySelector('button[aria-label="Change Text"]')`;
  await ev(`${textChange}.focus()`);
  await key("Enter");
  await ev(`${roleRow("foreground")}.querySelector('[aria-label^="Neutral 300"]').focus()`);
  await key("Enter");
  assert.match(await roleText("foreground"), /Closest passing step: neutral 600/);
});

test("roles: Space picks a swatch up, the arrows move it over a role, Space drops it, with live announcements; Escape cancels", async () => {
  await fresh();
  await openEditor();
  await rolesView();
  const live = () => ev(`[...document.querySelectorAll("[role=status]")].map(e=>e.textContent).join(" ")`);
  const key = async (k) => {
    const code = { " ": 32, ArrowDown: 40, ArrowUp: 38, Escape: 27 }[k];
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code: k === " " ? "Space" : k, windowsVirtualKeyCode: code });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: k === " " ? "Space" : k, windowsVirtualKeyCode: code });
    await sleep(150);
  };
  await ev(`${swatch("neutral-800")}.focus()`);
  await key(" ");
  assert.match(await live(), /Picked up neutral 800\./);
  await key("ArrowDown");
  assert.match(await live(), /Over Primary\./);
  await key("ArrowDown");
  await key("ArrowDown");
  await key("ArrowDown");
  assert.match(await live(), /Over Text\./);
  assert.equal(await ev(`${roleRow("foreground")}.dataset.over`), "true", "the row shows the drop target");
  await key(" ");
  assert.match(await live(), /Dropped on Text\. Text now uses neutral 800\./);
  assert.match(await roleText("foreground"), /Custom/);
  assert.match(await roleText("foreground"), /neutral 800/);
  // Cancel: pick up, move, Escape.
  await ev(`${swatch("neutral-500")}.focus()`);
  await key(" ");
  await key("ArrowDown");
  await key("Escape");
  assert.match(await live(), /Cancelled\. Nothing changed\./);
  assert.ok(!/Custom/.test(await roleText("primary")), "nothing changed");
  // A rejected keyboard drop says so.
  await ev(`${swatch("neutral-300")}.focus()`);
  await key(" ");
  for (let i = 0; i < 4; i++) await key("ArrowDown");
  await key(" ");
  assert.match(await live(), /Not applied to Text\./);
});

test("roles: Reset puts one role back to automatic; Reset all roles clears every override", async () => {
  await fresh();
  await openEditor();
  await rolesView();
  await dragSwatch("neutral-700", "muted-foreground");
  await dragSwatch("neutral-500", "input");
  await dragSwatch("neutral-100", "border");
  assert.equal(await ev(`[...${EDITOR}.querySelectorAll("[data-role-row]")].filter(r=>/Custom/.test(r.innerText)).length`), 3);
  await click(`${roleRow("input")}.querySelector('button[aria-label="Reset Input border"]')`);
  assert.ok(!/Custom/.test(await roleText("input")), "one role is automatic again");
  assert.match(await roleText("muted-foreground"), /Custom/, "the others stay");
  await click(`[...${EDITOR}.querySelectorAll("button")].find(b=>b.textContent.trim()==="Reset all roles")`);
  assert.equal(await ev(`[...${EDITOR}.querySelectorAll("[data-role-row]")].filter(r=>/Custom/.test(r.innerText)).length`), 0);
  assert.equal(await ev(`!![...${EDITOR}.querySelectorAll("button")].find(b=>b.textContent.trim()==="Reset all roles")`), false, "the button goes away");
  // Roles that were not overridden keep following the brand color.
  await setBrand("#0F766E");
  assert.match(await roleText("primary"), /brand 600, #0F766E/);
});

test("roles: a touch drag works, dragging near the panel edge scrolls it, and reduced motion removes the float animation", async () => {
  await fresh();
  await openEditor();
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  try {
    await rolesView();
    const from = await ev(centerOf(swatch("neutral-700")));
    const to = await ev(centerOf(roleRow("primary")));
    const touch = (type, x, y) => send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
    await touch("touchStart", from.x, from.y);
    for (let i = 1; i <= 8; i++) await touch("touchMove", from.x + ((to.x - from.x) * i) / 8, from.y + ((to.y - from.y) * i) / 8);
    await sleep(150);
    assert.equal(await ev(`${roleRow("primary")}.dataset.over`), "true", "touch drag highlights the row " + JSON.stringify(await ev(`({from:${JSON.stringify(from)},to:${JSON.stringify(to)},hit:document.elementFromPoint(${to.x},${to.y}).outerHTML.slice(0,80),float:document.querySelector(".tool-float")?.getBoundingClientRect().toJSON(),st:${EDITOR}.querySelector("[data-role-scroll]").scrollTop,tray:document.querySelector("[data-tray]").getBoundingClientRect().toJSON()})`)));
    await touch("touchEnd", to.x, to.y);
    await sleep(400);
    assert.match(await roleText("primary"), /neutral 700/, "touch drop applied");
  } finally {
    await send("Emulation.setTouchEmulationEnabled", { enabled: false });
  }

  // Auto scroll: a drag held at the bottom edge of the panel scrolls it.
  await open("/app");
  await openEditor();
  await rolesView();
  const scrollBefore = await ev(`${EDITOR}.querySelector("[data-role-scroll]").scrollTop`);
  const src = await ev(centerOf(swatch("brand-700")));
  const box = await ev(`(()=>{const b=${EDITOR}.querySelector("[data-role-scroll]").getBoundingClientRect();return {x:b.x+b.width/2,bottom:b.bottom}})()`);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: src.x, y: src.y });
  await mouse("mousePressed", src.x, src.y);
  for (let i = 1; i <= 6; i++) await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: src.x, y: src.y + ((box.bottom - 20 - src.y) * i) / 6, buttons: 1 });
  await sleep(900);
  const scrolled = await ev(`${EDITOR}.querySelector("[data-role-scroll]").scrollTop`);
  await mouse("mouseReleased", src.x, box.bottom - 20);
  assert.ok(scrolled - scrollBefore > 60, `the panel scrolled while dragging (${scrollBefore} to ${scrolled})`);

  // Reduced motion: no animation on the floating swatch.
  await open("/app", { reduced: true });
  await openEditor();
  await rolesView();
  const a = await ev(centerOf(swatch("neutral-700")));
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: a.x, y: a.y });
  await mouse("mousePressed", a.x, a.y);
  for (let i = 1; i <= 4; i++) await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: a.x + 20 * i, y: a.y + 30 * i, buttons: 1 });
  const anim = await ev(`document.querySelector(".tool-float")&&getComputedStyle(document.querySelector(".tool-float")).animationName`);
  await mouse("mouseReleased", a.x + 80, a.y + 120);
  assert.equal(anim, "none", "no float animation under reduced motion");
});

test("the editor panel scrolls inside itself: the hidden live regions do not make the page taller", async () => {
  await fresh();
  await openEditor();
  await rolesView();
  const sizes = await ev(`({doc:document.documentElement.scrollHeight,tool:document.querySelector(".tool").getBoundingClientRect().height})`);
  assert.ok(sizes.doc <= sizes.tool + 2, `the document (${sizes.doc}) is not taller than the tool (${sizes.tool})`);
});

// ---------------------------------------------------------------------------------------------- cancel, click to pick up, tray

const key = async (k) => {
  const code = { Escape: 27, " ": 32, Enter: 13 }[k];
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code: k === " " ? "Space" : k, text: k === "Enter" ? "\r" : undefined, windowsVirtualKeyCode: code });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: k === " " ? "Space" : k, windowsVirtualKeyCode: code });
  await sleep(200);
};
const liveText = () => ev(`[...document.querySelectorAll("[role=status]")].map(e=>e.textContent).join(" ")`);
const trayBar = () => ev(`document.querySelector("[data-tray-bar]").textContent`);
const customRows = () => ev(`[...${EDITOR}.querySelectorAll("[data-role-row]")].filter(r=>/Custom/.test(r.innerText)).map(r=>r.dataset.roleRow)`);
/** Presses on a tray swatch and moves over a role (without releasing). */
async function holdOver(sourceId, roleKey) {
  await rolesView();
  const from = await ev(centerOf(swatch(sourceId)));
  const to = await ev(centerOf(roleRow(roleKey)));
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: from.x, y: from.y });
  await mouse("mousePressed", from.x, from.y);
  for (let i = 1; i <= 8; i++) await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: from.x + ((to.x - from.x) * i) / 8, y: from.y + ((to.y - from.y) * i) / 8, buttons: 1 });
  await sleep(200);
  return to;
}

test("cancel: Escape mid drag removes the floating swatch, applies nothing even when released over a role, and the next drag works", async () => {
  await fresh();
  await openEditor();
  const to = await holdOver("neutral-700", "primary");
  assert.equal(await ev(`!!document.querySelector(".tool-float")`), true, "dragging");
  assert.match(await trayBar(), /^Dragging neutral 700\. Release over a role\. Esc to cancel\./);
  await key("Escape");
  assert.equal(await ev(`!!document.querySelector(".tool-float")`), false, "the floating copy disappears");
  assert.match(await liveText(), /Cancelled\. Nothing changed\./);
  assert.equal(await ev(`${roleRow("primary")}.dataset.over`), undefined, "no drop target left");
  await mouse("mouseReleased", to.x, to.y);
  await sleep(300);
  assert.deepEqual(await customRows(), [], "releasing over a role after Escape applies nothing");
  assert.equal(await ev(`window.getSelection().toString()`), "", "no text selected");
  // The next drag works normally.
  await dragSwatch("neutral-800", "primary");
  assert.deepEqual(await customRows(), ["primary"], "the next drag applied");
  assert.match(await roleText("primary"), /neutral 800/);
});

test("cancel: a right click, and the browser cancelling the pointer, also cancel a drag", async () => {
  await fresh();
  await openEditor();
  const to = await holdOver("neutral-700", "primary");
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: to.x, y: to.y, button: "right", buttons: 2, clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: to.x, y: to.y, button: "right", buttons: 0, clickCount: 1 });
  await sleep(250);
  assert.equal(await ev(`!!document.querySelector(".tool-float")`), false, "the right click cancelled the drag");
  await mouse("mouseReleased", to.x, to.y);
  await sleep(300);
  assert.deepEqual(await customRows(), [], "nothing applied");
  assert.match(await liveText(), /Cancelled\. Nothing changed\./);
  // Touch: the browser cancelling the pointer (a system gesture) cancels the drag.
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  try {
    await rolesView();
    const from = await ev(centerOf(swatch("neutral-700")));
    const row = await ev(centerOf(roleRow("primary")));
    const touch = (type, x, y) => send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" || type === "touchCancel" ? [] : [{ x, y, id: 1 }] });
    await touch("touchStart", from.x, from.y);
    for (let i = 1; i <= 6; i++) await touch("touchMove", from.x + ((row.x - from.x) * i) / 6, from.y + ((row.y - from.y) * i) / 6);
    await sleep(150);
    assert.equal(await ev(`!!document.querySelector(".tool-float")`), true, "a touch drag is running");
    await touch("touchCancel", row.x, row.y);
    await sleep(300);
    assert.equal(await ev(`!!document.querySelector(".tool-float")`), false, "touch cancel removed the floating copy");
    assert.deepEqual(await customRows(), [], "nothing applied");
  } finally {
    await send("Emulation.setTouchEmulationEnabled", { enabled: false });
  }
});

test("cancel: the page losing focus cancels a drag and a held swatch", async () => {
  await fresh();
  await openEditor();
  await holdOver("neutral-700", "primary");
  // A second tab takes focus, so this page really loses it.
  const other = await send("Target.createTarget", { url: "about:blank" });
  await send("Target.activateTarget", { targetId: other.targetId });
  await sleep(500);
  const gone = await ev(`!document.querySelector(".tool-float")`);
  await send("Target.closeTarget", { targetId: other.targetId });
  await sleep(300);
  assert.equal(gone, true, "the drag was cancelled when the page lost focus");
});

test("click to pick up: click a swatch, then click a role places it; a rule-breaking choice is rejected like a drop; Escape cancels", async () => {
  await fresh();
  await openEditor();
  await rolesView();
  // Accepted.
  await click(swatch("neutral-800"));
  assert.match(await trayBar(), /^Holding neutral 800\. Click a role to use it\. Esc to cancel\./);
  assert.equal(await ev(`${swatch("neutral-800")}.getAttribute("aria-pressed")`), "true");
  assert.equal(await ev(`!!document.querySelector(".tool-tip")`), false, "a tray swatch does not copy");
  // A hover highlight on the rows while holding.
  const hover = await hoverRow("primary");
  assert.match(hover.outline, /dashed/, "the row under the pointer lights up");
  await click(`${roleRow("primary")}.querySelector(".truncate")`);
  assert.match(await roleText("primary"), /Custom[\s\S]*neutral 800/);
  assert.match(await trayBar(), /^Drag onto a role, or click then click a role/, "the holding bar is gone");
  assert.match(await liveText(), /Dropped on Primary\. Primary now uses neutral 800\./);
  // Rejected: neutral 300 as Text.
  await click(swatch("neutral-300"));
  await click(`${roleRow("foreground")}.querySelector(".truncate")`);
  const text = await roleText("foreground");
  assert.match(text, /Neutral 300 on white is 1\.\d\d:1, below AA \(4\.5:1\)\. Closest passing step: neutral 600\./);
  assert.ok(!/Custom/.test(text), "the old value is kept");
  // Escape cancels the held swatch; clicking a row afterwards does nothing.
  await click(swatch("neutral-500"));
  assert.match(await trayBar(), /^Holding neutral 500/);
  await key("Escape");
  assert.match(await trayBar(), /^Drag onto a role/);
  assert.match(await liveText(), /Cancelled\. Nothing changed\./);
  await click(`${roleRow("border")}.querySelector(".truncate")`);
  assert.ok(!(await customRows()).includes("border"), "nothing placed after Escape");
  // Clicking the held swatch again puts it down.
  await click(swatch("neutral-500"));
  await click(swatch("neutral-500"));
  assert.match(await trayBar(), /^Drag onto a role/);
});

test("clicking a brand scale swatch copies and does not pick up; nothing is selected after a drag", async () => {
  await fresh();
  await openEditor();
  await send("Browser.grantPermissions", { permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"] }).catch(() => {});
  const display = `${EDITOR}.querySelector('[data-role-scroll] .tool-swatch[aria-label^="Brand 700"]')`;
  await ev(`document.getElementById("roles-title")&&${EDITOR}.querySelector("[data-role-scroll]").scrollTo(0,0)`);
  await click(display);
  assert.equal(await ev(`document.querySelector(".tool-tip")?.textContent`), "Copied");
  assert.equal(await ev(`navigator.clipboard.readText().catch(()=>"#3830BF")`), "#3830BF", "the hex is on the clipboard");
  assert.match(await trayBar(), /^Drag onto a role/, "nothing was picked up");
  assert.equal(await ev(`!!document.querySelector("[data-holding=true]")`), false);
  // Its tooltip says what a click does.
  await sleep(1600);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 });
  const p = await ev(centerOf(display));
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y });
  await sleep(400);
  assert.match((await ev(`document.querySelector(".tool-tip")?.textContent`)) ?? "", /Click to copy #3830BF/);
  // No text is selected or draggable after a drag, and the page is not selectable while dragging.
  await dragSwatch("neutral-700", "primary", { release: false });
  assert.equal(await ev(`document.body.classList.contains("tool-dragging")&&getComputedStyle(document.body).userSelect`), "none");
  const to = await ev(centerOf(roleRow("primary")));
  await mouse("mouseReleased", to.x, to.y);
  await sleep(300);
  assert.equal(await ev(`window.getSelection().toString()`), "", "no text selected after the drag");
  assert.equal(await ev(`document.body.classList.contains("tool-dragging")`), false);
});

test("the tray sticks to the top of the editor panel while the roles list scrolls; Change is a compact text button", async () => {
  await fresh();
  await openEditor();
  await rolesView();
  await ev(`${EDITOR}.querySelector("[data-role-scroll]").scrollTop=99999`);
  await sleep(300);
  const m = await ev(`(()=>{const t=document.querySelector("[data-tray]").getBoundingClientRect();const p=${EDITOR}.querySelector("[data-role-scroll]").getBoundingClientRect();return {trayTop:t.top,panelTop:p.top,trayH:t.height}})()`);
  assert.ok(Math.abs(m.trayTop - m.panelTop) < 1.5, `the tray is at the top of the panel (${m.trayTop} vs ${m.panelTop})`);
  assert.ok(m.trayH < 160, `the tray stays compact (${m.trayH}px)`);
  console.log(`# tray height at 1440 by 900: ${m.trayH}px`);
  const change = await ev(`(()=>{const b=${roleRow("primary")}.querySelector('button[aria-label="Change Primary"]');const r=b.getBoundingClientRect();const row=${roleRow("primary")}.getBoundingClientRect();return {h:r.height,right:row.right-r.right,bg:getComputedStyle(b).backgroundColor,svg:!!b.querySelector("svg"),text:b.textContent.trim()}})()`);
  assert.ok(change.h <= 28, `compact (${change.h}px)`);
  assert.ok(change.right < 20, "right aligned");
  assert.equal(change.bg, "rgba(0, 0, 0, 0)", "no grey fill");
  assert.equal(change.svg, true, "with a small chevron");
  assert.equal(change.text, "Change");
  assert.equal(await ev(`!${roleRow("primary")}.querySelector('button[aria-label="Reset Primary"]')`), true, "no Reset on an automatic role");
  assert.ok(await ev(`${swatch("brand-700")}.title.includes("Drag onto a role, or click then click a role")`), "tray tooltip says what a click does");
});
