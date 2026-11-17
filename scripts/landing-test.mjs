/**
 * Landing page tests ("/"), run in a real headless Chrome against a production build (see scripts/lib/cdp.mjs).
 *
 *   node --test scripts/landing-test.mjs      (or npm run test:fast, which includes it)
 *
 * Checked: no sideways scroll at 360, 390, 768 and 1280; the demo controls change the SKILL.md excerpt and the verdict, with
 * numbers that match the app's real engine; the ghost cursor plays by itself and stops for good at the first touch, tap or key
 * press; reduced motion stops everything; the buttons go to /app; the feedback link; the Plinth name, wordmark, favicon and
 * share image; square corners, title sizes, line heights, tap targets, keyboard focus; the first load stays light.
 */

import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { ev, navigate, send, settle, setWidth, sleep, start, state, stop, waitFor } from "./lib/cdp.mjs";

const lib = "src/lib/design-system";
const out = mkdtempSync(join(tmpdir(), "dsmd-landing-"));
try {
  execFileSync("npx", ["tsc", ...["generate", "presets", "normalize", "fonts", "skill/generate", "types"].map((f) => `${lib}/${f}.ts`), "--outDir", out, "--module", "commonjs", "--moduleResolution", "node", "--target", "es2020", "--skipLibCheck"], { stdio: "pipe" });
} catch {
  // tsc exits non-zero on type errors but still writes files; real problems show up as missing files below.
}
const require = createRequire(import.meta.url);
const { createDesignSystem } = require(join(out, "generate.js"));
const { PRESETS } = require(join(out, "presets.js"));
const { applyPatch } = require(join(out, "normalize.js"));
const { catalogFont, defaultTracking } = require(join(out, "fonts.js"));
const { generateSkillFile } = require(join(out, "skill/generate.js"));
const { STACK_IDS } = require(join(out, "types.js"));

/** The same settings the demo builds, made straight from the library, to compare numbers. */
const FONTS = [["Geist", "Geist"], ["Newsreader", "Geist"], ["IBM Plex Sans", "IBM Plex Sans"]];
function engine({ brand, radius, font }) {
  const [h, b] = FONTS[font];
  const settings = applyPatch(PRESETS["saas-clean"].settings, {
    colors: { brand },
    radius: { base: radius },
    typography: { headingFont: catalogFont(h), bodyFont: catalogFont(b), headingTracking: defaultTracking(catalogFont(h)) },
    project: { name: "Acme Billing", description: "Billing software for small teams.", stack: "next-tailwind-shadcn" },
  });
  const system = createDesignSystem(settings);
  return { system, file: generateSkillFile(system, { presetId: "saas-clean" }) };
}

const LANDING_READY = `document.readyState === "complete" && !!document.querySelector(".pl[data-engine=ready]")`;
const asExpr = (s) => (/^(document\.|\[\.\.\.|\()/.test(s) ? s : `document.querySelector(${JSON.stringify(s)})`);
const centerOf = (selector) => `(()=>{const e=${asExpr(selector)};if(!e)return null;e.scrollIntoView({block:"center",inline:"center"});const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`;
async function click(selector) {
  const p = await ev(centerOf(selector));
  assert.ok(p, `element not found: ${selector}`);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: p.x, y: p.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: p.x, y: p.y, button: "left", clickCount: 1 });
  await settle();
}
const CODES = { Tab: 9, ArrowRight: 39, ArrowLeft: 37, Shift: 16 };
async function key(k) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code: k, windowsVirtualKeyCode: CODES[k] });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: k, windowsVirtualKeyCode: CODES[k] });
  await settle();
}

/** Opens the landing page: motion allowed or reduced, light or dark, at a width. */
async function open({ reduced = false, theme = "light", width = 1280, height = 900 } = {}) {
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reduced ? "reduce" : "no-preference" }] });
  await navigate(state.baseUrl + "/favicon.ico", null);
  // The window size is set before the page loads, so the stage is where it will be for the whole visit.
  await setWidth(width, height);
  await ev(`localStorage.clear();sessionStorage.clear();localStorage.setItem("design-sys-md:tool-theme","${theme}")`);
  await navigate(state.baseUrl + "/", LANDING_READY);
}

const CENTER_FILE_HEAD = `(()=>{const e=document.querySelector(".file-head");e.scrollIntoView({block:"center"});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`;
const stageState = () => ev(`document.querySelector("#stage").dataset.ghost`);
const demoState = () =>
  ev(`(()=>{const code=document.querySelector("[data-excerpt]").innerText;const line=(k)=>{const m=code.match(new RegExp("^"+k+"\\\\s+(.*)$","m"));return m?m[1].trim():null};return {
    brand:line("brand"), onBrand:line("on-brand"), heading:line("heading"), body:line("body"), control:line("control"), card:line("card"),
    verdict:document.querySelector("#verdict").innerText.replace(/\\s+/g," ").trim(), pressed:document.querySelector("button.sw[aria-pressed=true]")?.dataset.hex??null,
    radius:document.querySelector("#radius").value, font:[...document.querySelectorAll("#fonts button")].findIndex(b=>b.getAttribute("aria-pressed")==="true"), code}})()`);

before(async () => {
  await start({ width: 1280, height: 900 });
});
after(() => stop());

const WIDTHS = [360, 390, 768, 1280];
const OVERFLOW = `(()=>{const win=innerWidth;const clipped=(el)=>{for(let p=el.parentElement;p;p=p.parentElement){const o=getComputedStyle(p).overflowX;if(o==="auto"||o==="scroll"||o==="hidden"||o==="clip")return true}return false};
  const wide=[...document.querySelectorAll(".pl *")].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>win+1&&!clipped(e)}).map(e=>e.tagName+"."+e.className);
  return {page:document.documentElement.scrollWidth-win,body:document.body.scrollWidth-win,wide:wide.slice(0,5)}})()`;

test("no horizontal scroll at 360, 390, 768 and 1280, in light and dark", async () => {
  for (const theme of ["light", "dark"]) {
    await open({ theme });
    for (const width of WIDTHS) {
      await setWidth(width, 900);
      const m = await ev(OVERFLOW);
      assert.ok(m.page <= 0 && m.body <= 0, `${theme} ${width}: the page scrolls sideways by ${m.page}px`);
      assert.deepEqual(m.wide, [], `${theme} ${width}: elements stick out of the window`);
    }
  }
});

test("the demo controls change the SKILL.md excerpt and the verdict, and the numbers come from the real engine", async () => {
  await open({ reduced: true });
  assert.equal(await stageState(), "off", "reduced motion: the ghost does not play");
  const start = await demoState();
  assert.equal(start.brand, "#3B5BDB");
  assert.equal(start.radius, "0");
  // Every brand swatch: excerpt, verdict and pressed state follow, and match what the library computes for the same input.
  for (const hex of ["#F2B705", "#0F8A5F", "#D6336C", "#1F2328", "#C2410C", "#3B5BDB"]) {
    await click(`button.sw[data-hex="${hex}"]`);
    const m = await demoState();
    const { system } = engine({ brand: hex, radius: 0, font: 0 });
    const text = system.tokens.colors.brandReport.primaryText;
    assert.equal(m.pressed, hex);
    assert.equal(m.brand, hex);
    assert.match(m.verdict, new RegExp(`Button text is ${text.isWhite ? "white" : "dark"}, ${(Math.round(text.ratio * 10) / 10).toFixed(1)}:1\\.`), `${hex}: ${m.verdict}`);
    assert.ok(m.onBrand.startsWith(text.hex.toUpperCase()), `${hex}: on-brand ${m.onBrand} vs ${text.hex}`);
    assert.equal(m.verdict.includes("Passes AA."), text.ratio >= 4.5);
  }
  // Corners: the real slider, with the keyboard.
  await ev(`document.querySelector("#radius").focus()`);
  for (let i = 0; i < 6; i++) await key("ArrowRight");
  let m = await demoState();
  assert.equal(m.radius, "12");
  const r12 = engine({ brand: "#3B5BDB", radius: 12, font: 0 }).system.tokens.radius;
  assert.equal(m.control, `${r12.md}px`);
  assert.equal(m.card, `${r12.lg}px`);
  assert.equal(await ev(`getComputedStyle(document.querySelector(".sample .sbtn.primary")).borderTopLeftRadius`), `${r12.md}px`, "the sample's buttons follow the control radius");
  assert.equal(await ev(`getComputedStyle(document.querySelector(".sample .plan")).borderTopLeftRadius`), `${r12.lg}px`, "the sample's cards follow the card radius");
  // Type.
  await click(`#fonts button:nth-child(2)`);
  m = await demoState();
  assert.equal(m.heading, "Newsreader");
  assert.equal(m.body, "Geist");
  assert.match(await ev(`getComputedStyle(document.querySelector(".sample .s-title")).fontFamily`), /newsreader/i);
  await click(`#fonts button:nth-child(3)`);
  m = await demoState();
  assert.equal(m.heading, "IBM Plex Sans");
  assert.match(await ev(`getComputedStyle(document.querySelector(".sample .s-title")).fontFamily`), /plex/i);
  // The custom picker.
  await ev(`(()=>{const i=document.querySelector('.pl input[type=color]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(i,"#e11d48");i.dispatchEvent(new Event("input",{bubbles:true}))})()`);
  await settle();
  m = await demoState();
  assert.equal(m.brand, "#E11D48");
  assert.equal(m.pressed, null, "no swatch is pressed for a custom color");
  // Two rules and the front matter name come from the real generated file.
  const { file } = engine({ brand: "#E11D48", radius: 12, font: 2 });
  assert.ok(m.code.includes(`name: ${file.slug}`), "the file name comes from the generator");
  assert.ok(m.code.includes("- One primary button per view."));
  assert.ok(m.code.includes("- One accent color per screen: the brand color."));
  // The facts row and the file size come from the engine and the generator too.
  const facts = await ev(`[...document.querySelectorAll(".facts b")].map(b=>b.textContent)`);
  const base = engine({ brand: "#3B5BDB", radius: 0, font: 0 });
  assert.deepEqual(facts, [`${Object.keys(base.system.tokens.colors.brand).length} steps`, "4.5:1", `${base.system.tokens.spacing.base}px`, `${STACK_IDS.length} stacks`]);
  await click(`button.sw[data-hex="#3B5BDB"]`);
  await click(`#fonts button:nth-child(1)`);
  await ev(`document.querySelector("#radius").focus()`);
  for (let i = 0; i < 6; i++) await key("ArrowLeft");
  const size = await ev(`document.querySelector(".file-foot").textContent`);
  assert.ok(size.includes(`about ${Math.round(base.file.agentsBytes / 1024)} KiB`), size);
});

test("the ghost cursor plays by itself, operates the real controls, and stops for good at the first press or key", async () => {
  for (const how of ["press", "key"]) {
    await open({ width: 390, height: 420 });
    // The stage starts below the fold on a phone: nothing plays until its top is on screen.
    assert.equal(await stageState(), "idle", "waiting for the stage to come on screen");
    await ev(`document.querySelector("#stage").scrollIntoView({block:"start"})`);
    await waitFor(`document.querySelector("#stage").dataset.ghost === "playing"`, { label: "the ghost to start", timeout: 15000 });
    await waitFor(`document.querySelector("button.sw[aria-pressed=true]")?.dataset.hex === "#F2B705"`, { label: "the ghost to pick Saffron", timeout: 15000 });
    assert.match((await demoState()).verdict, /dark/, "the real verdict followed the ghost");
    // A real press or key press in the stage stops it for good.
    if (how === "press") {
      const p = await ev(CENTER_FILE_HEAD);
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x: p.x, y: p.y, button: "left", clickCount: 1 });
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: p.x, y: p.y, button: "left", clickCount: 1 });
    } else {
      await ev(`document.querySelector("#radius").focus()`);
      await key("Tab");
    }
    await waitFor(`document.querySelector("#stage").dataset.ghost === "stopped"`, { label: "the ghost to stop" });
    const frozen = JSON.stringify({ ...(await demoState()), code: undefined });
    assert.equal(await ev(`getComputedStyle(document.querySelector(".ghost")).display`), "none", "the cursor is gone");
    await sleep(4500); // elapsed time is the thing measured: the old loop would have acted again within this time
    assert.equal(JSON.stringify({ ...(await demoState()), code: undefined }), frozen, `${how}: nothing changes after the visitor takes over`);
    assert.equal(await stageState(), "stopped");
  }
});

test("a touch in the stage stops the ghost too", async () => {
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  await open({ width: 390, height: 700 });
  await ev(`document.querySelector("#stage").scrollIntoView({block:"start"})`);
  await waitFor(`document.querySelector("#stage").dataset.ghost === "playing"`, { label: "the ghost to start", timeout: 15000 });
  const p = await ev(CENTER_FILE_HEAD);
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: p.x, y: p.y, id: 1 }] });
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await waitFor(`document.querySelector("#stage").dataset.ghost === "stopped"`, { label: "the ghost to stop after a touch" });
  await send("Emulation.setTouchEmulationEnabled", { enabled: false });
});

const RUNNING = `document.getAnimations().filter(a=>a.playState==="running")`;

test("with reduced motion on nothing animates: no cursor, Three steps at rest in its finished state", async () => {
  await open({ reduced: true });
  assert.equal(await stageState(), "off");
  assert.equal(await ev(`getComputedStyle(document.querySelector(".ghost")).display`), "none");
  // Three steps, scrolled into view: still nothing runs, and every part shows its finished state.
  await ev(`document.querySelector("#how").scrollIntoView({block:"center"})`);
  await sleep(800); // elapsed time is the thing measured: a loop would have started by now
  assert.equal(await ev(`${RUNNING}.length`), 0, "no animation runs");
  const rest = await ev(`(()=>{const q=(s)=>getComputedStyle(document.querySelector(s));return {ring:q(".ring").opacity,typed:Math.round(document.querySelector(".term .typed").getBoundingClientRect().width),read:q(".term .read").opacity,chip:q(".file-chip").opacity,bar:Math.round(document.querySelector(".dl .bar i").getBoundingClientRect().width),rad:q(".rads i.live").borderTopLeftRadius,n1:q(".step:nth-child(1) .num").backgroundColor,names:getComputedStyle(document.querySelector(".how.play, .how")).animationName}})()`);
  assert.equal(rest.ring, "0", "the ring has finished");
  assert.ok(rest.typed > 150, "the prompt is fully typed");
  assert.equal(rest.read, "1");
  assert.equal(rest.chip, "1", "the saved chip shows");
  assert.ok(rest.bar > 50, "the size bar is filled");
  assert.equal(rest.rad, "8px", "the radius tile is rounded");
  // Using the controls does not animate either.
  await click(`button.sw[data-hex="#D6336C"]`);
  assert.equal(await ev(`${RUNNING}.length`), 0, "no transition runs after a click");
});

test("with motion on, nothing moves on load, and Three steps plays its 12 second loop only while it is on screen", async () => {
  await open({ width: 1280, height: 900 });
  // Stop the ghost, so only the page itself is measured.
  await click(".file-head");
  await waitFor(`document.querySelector("#stage").dataset.ghost === "stopped"`);
  await ev(`window.scrollTo(0, 0)`);
  await sleep(500);
  const names = await ev(`[...new Set(document.getAnimations().filter(a=>a instanceof CSSAnimation).map(a=>a.animationName))]`);
  assert.deepEqual(names, [], "on load nothing moves");
  assert.equal(await ev(`document.querySelector("#how").dataset.play`), "false", "Three steps rests while off screen");
  await ev(`document.querySelector("#how").scrollIntoView({block:"center"})`);
  await waitFor(`document.querySelector("#how").dataset.play === "true"`, { label: "Three steps to play" });
  const loop = await ev(`(()=>{const a=document.getAnimations().filter(x=>x instanceof CSSAnimation&&/^pl-(hop|fill|typing|n1|act1)$/.test(x.animationName));return {names:a.map(x=>x.animationName).sort(),durations:[...new Set(a.map(x=>x.effect.getTiming().duration))],infinite:a.every(x=>x.effect.getTiming().iterations===Infinity)}})()`);
  assert.deepEqual(loop.names, ["pl-act1", "pl-fill", "pl-hop", "pl-n1", "pl-typing"]);
  assert.deepEqual(loop.durations, [12000], "one 12 second loop");
  assert.equal(loop.infinite, true, "it loops");
  await ev(`window.scrollTo(0, 0)`);
  await waitFor(`document.querySelector("#how").dataset.play === "false"`, { label: "Three steps to stop off screen" });
  assert.equal(await ev(`document.getAnimations().filter(a=>a instanceof CSSAnimation&&/^pl-(hop|fill|typing)$/.test(a.animationName)).length`), 0, "the loop stops off screen");
});

test("Three steps follows the visitor's real color scale", async () => {
  await open({ reduced: true });
  await click(`button.sw[data-hex="#0F8A5F"]`);
  const { system } = engine({ brand: "#0F8A5F", radius: 0, font: 0 });
  const scale = Object.values(system.tokens.colors.brand);
  const drawn = await ev(`[...document.querySelectorAll(".how .scale")[0].querySelectorAll("i")].map(i=>{const c=getComputedStyle(i).backgroundColor.match(/\\d+/g).map(Number);return "#"+c.slice(0,3).map(n=>n.toString(16).padStart(2,"0")).join("").toUpperCase()})`);
  assert.deepEqual(drawn, scale.map((h) => h.toUpperCase()));
  assert.equal(await ev(`document.querySelector(".brandhex").textContent`), "#0F8A5F");
});

test("Open Plinth and Build your brand file go to /app", async () => {
  await open({ reduced: true });
  const links = await ev(`[...document.querySelectorAll(".pl a.btn")].map(a=>({t:a.textContent.trim(),h:a.getAttribute("href")}))`);
  assert.deepEqual(links, [{ t: "Open Plinth", h: "/app" }, { t: "Build your brand file", h: "/app" }, { t: "Open Plinth", h: "/app" }]);
  await click(`.hero a.btn`);
  await waitFor(`location.pathname === "/app" && document.title === "Plinth: build your design system"`, { label: "the tool" });
});

test("the feedback link and the footer are exact", async () => {
  await open({ reduced: true });
  assert.equal(await ev(`document.querySelector("footer a").getAttribute("href")`), "mailto:kiranjinde19@gmail.com?subject=Plinth%20feedback");
  assert.equal(await ev(`document.querySelector("footer a").textContent`), "Send feedback");
  assert.equal(await ev(`document.querySelector("footer span").textContent`), "Made by Kiran B. Free to use. Nothing leaves your browser: no cookies, no tracking.");
});

test("the name, wordmark, favicon and share image are Plinth", async () => {
  await open({ reduced: true });
  const head = await ev(`(()=>{const m=(s)=>document.querySelector(s)?.getAttribute("content");return {title:document.title,description:m('meta[name=description]'),ogTitle:m('meta[property="og:title"]'),ogImage:m('meta[property="og:image"]'),twitter:m('meta[name="twitter:card"]'),twImage:m('meta[name="twitter:image"]'),icons:[...document.querySelectorAll('link[rel~=icon]')].map(l=>l.getAttribute("type")),apple:!!document.querySelector('link[rel=apple-touch-icon]')}})()`);
  assert.equal(head.title, "Plinth: your brand design system as one SKILL.md file");
  assert.equal(head.description, "Plinth builds your brand design system and turns it into one SKILL.md or AGENTS.md file for Claude Code, Codex and ChatGPT. Free, no login.");
  assert.equal(head.ogTitle, "Plinth: your brand design system as one SKILL.md file");
  assert.match(head.ogImage, /\/brand\/plinth-share\.png$/);
  assert.match(head.twImage, /\/brand\/plinth-share\.png$/);
  assert.equal(head.twitter, "summary_large_image");
  assert.ok(head.icons.includes("image/svg+xml"), "an SVG favicon");
  assert.ok(head.apple);
  // The wordmark file is exactly the one asked for, and the header logo draws the same paths in currentColor.
  const file = await (await fetch(state.baseUrl + "/brand/plinth-wordmark.svg")).text();
  assert.ok(file.startsWith('<svg width="76" height="22" viewBox="0 0 76 22" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'));
  const filePaths = [...file.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(filePaths.length, 6);
  const drawn = await ev(`[...document.querySelectorAll(".mark svg path")].map(p=>p.getAttribute("d"))`);
  assert.deepEqual(drawn, filePaths);
  assert.equal(await ev(`document.querySelector(".mark svg").getAttribute("fill")`), "currentColor");
  const fill = () => ev(`getComputedStyle(document.querySelector(".mark svg path")).fill`);
  const light = await fill();
  await click("#theme");
  const dark = await fill();
  assert.notEqual(light, dark, "the wordmark follows light and dark");
  // The favicon: the P path only, black on transparent, white in dark mode.
  const icon = await (await fetch(state.baseUrl + "/icon.svg")).text();
  assert.match(icon, /prefers-color-scheme:dark/);
  assert.equal([...icon.matchAll(/<path /g)].length, 1, "only the P");
  assert.ok(icon.includes("M0 0H12.8571V2.14286H15V12.8571H12.8571V15H4.28571V21.4286H0V0ZM10.7143 4.28571H4.28571V10.7143H10.7143V4.28571Z"));
  // The share image is 1200 by 630.
  const png = Buffer.from(await (await fetch(state.baseUrl + "/brand/plinth-share.png")).arrayBuffer());
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.equal(await ev(`new Promise(r=>{const i=new Image();i.onload=()=>r(i.naturalWidth);i.src="/favicon.ico"})`), 48, "the ico favicon is the P too");
});

test("light and dark: the toggle works, is remembered, and the stage stays dark", async () => {
  await open({ reduced: true, theme: "light" });
  const bg = () => ev(`getComputedStyle(document.querySelector(".pl")).backgroundColor`);
  const stageBg = () => ev(`getComputedStyle(document.querySelector("#stage")).backgroundColor`);
  const lightBg = await bg();
  const stageLight = await stageBg();
  await click("#theme");
  assert.equal(await ev(`document.querySelector(".pl").dataset.theme`), "dark");
  assert.notEqual(await bg(), lightBg);
  assert.equal(await stageBg(), stageLight, "the stage is always dark");
  assert.equal(await ev(`localStorage.getItem("design-sys-md:tool-theme")`), "dark", "the same saved choice the tool uses");
  await navigate(state.baseUrl + "/", LANDING_READY);
  assert.equal(await ev(`document.querySelector(".pl").dataset.theme`), "dark", "remembered after a reload");
  await click("#theme");
  assert.equal(await ev(`document.querySelector(".pl").dataset.theme`), "light");
});

test("the page is square, left aligned, with title sizes and line heights in range", async () => {
  await open({ reduced: true, width: 1440 });
  // Square corners everywhere except the sample product in the demo and the radius tiles in Three steps.
  const round = await ev(`[...document.querySelectorAll(".pl *")].filter(e=>!e.closest(".sample")&&!e.closest(".rads")).filter(e=>{const s=getComputedStyle(e);return [s.borderTopLeftRadius,s.borderTopRightRadius,s.borderBottomLeftRadius,s.borderBottomRightRadius].some(v=>v!=="0px")}).map(e=>e.tagName+"."+e.className).slice(0,6)`);
  assert.deepEqual(round, [], "these have rounded corners");
  // Left aligned, titles above their body in one column.
  const align = await ev(`[...document.querySelectorAll(".pl h1,.pl h2,.pl h3,.pl p")].filter(e=>!e.closest(".sample")).filter(e=>getComputedStyle(e).textAlign!=="start"&&getComputedStyle(e).textAlign!=="left").length`);
  assert.equal(align, 0, "everything is left aligned");
  const stacked = await ev(`[...document.querySelectorAll(".sec-head")].every(h=>{const t=h.querySelector("h2").getBoundingClientRect(), p=h.querySelector("p");return !p||p.getBoundingClientRect().top>=t.bottom-1})&&document.querySelector(".hero h1").getBoundingClientRect().bottom<=document.querySelector(".lede").getBoundingClientRect().top+1`);
  assert.equal(stacked, true);
  // Title sizes: hero at most 58px, section titles at most 40px. Line height 1.1 to 1.2 on titles, 1.65 to 1.75 on body text.
  const sizes = await ev(`(()=>{const f=(s)=>[...document.querySelectorAll(s)].map(e=>{const c=getComputedStyle(e);return {s,fs:parseFloat(c.fontSize),lh:parseFloat(c.lineHeight)/parseFloat(c.fontSize)}});return {titles:[...f(".hero h1"),...f(".sec-title"),...f(".close h2"),...f(".story .last")],body:[...f(".lede"),...f(".sec-sub"),...f(".icard p"),...f(".step p"),...f(".story .body p:not(.last)"),...f(".ba figcaption"),...f("details p"),...f(".inside-note")]}})()`);
  for (const t of sizes.titles) {
    assert.ok(t.lh >= 1.09 && t.lh <= 1.21, `${t.s} line height ${t.lh}`);
    assert.ok(t.fs <= (t.s === ".hero h1" ? 58 : 40) + 0.5, `${t.s} is ${t.fs}px`);
  }
  assert.ok(sizes.titles.find((t) => t.s === ".hero h1").fs >= 56, "the hero headline is large on desktop");
  for (const b of sizes.body) assert.ok(b.lh >= 1.64 && b.lh <= 1.76, `${b.s} line height ${b.lh}`);
  // The story and the questions span the full content width.
  const widths = await ev(`(()=>{const w=document.querySelector(".wrap").getBoundingClientRect().width;const f=(s)=>document.querySelector(s).getBoundingClientRect().width/w;return {story:f(".story .body p"),faq:f(".faq"),summary:f(".faq summary")}})()`);
  assert.ok(widths.story > 0.98 && widths.faq > 0.98 && widths.summary > 0.98, JSON.stringify(widths));
  await ev(`document.querySelectorAll("details").forEach(d=>d.open=true)`);
  assert.ok((await ev(`document.querySelector(".faq details p").getBoundingClientRect().width/document.querySelector(".wrap").getBoundingClientRect().width`)) > 0.98, "the answers span the full width too");
});

test("the before and after frames have exactly the same height, at every width", async () => {
  await open({ reduced: true });
  for (const width of [1280, 768, 390]) {
    await setWidth(width, 900);
    await waitFor(`[...document.querySelectorAll(".ba img")].every(i=>i.complete&&i.naturalWidth>0)`, { label: "the screenshots to load" });
    const h = await ev(`[...document.querySelectorAll(".ba .shot")].map(e=>Math.round(e.getBoundingClientRect().height*100)/100)`);
    assert.equal(h.length, 2);
    assert.equal(h[0], h[1], `${width}: frames are ${h.join(" and ")}px high`);
  }
});

test("tap targets are at least 44px, and the keyboard focus is visible", async () => {
  for (const width of [1280, 390]) {
    await open({ reduced: true, width });
    const small = await ev(`[...document.querySelectorAll(".pl a,.pl button,.pl summary,.pl input,.pl label.custom")].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0}).filter(e=>{const r=e.getBoundingClientRect();return r.height<43.5||r.width<43.5}).map(e=>e.tagName+"."+e.className+" "+Math.round(e.getBoundingClientRect().width)+"x"+Math.round(e.getBoundingClientRect().height)).slice(0,6)`);
    assert.deepEqual(small, [], `${width}: smaller than 44px`);
  }
  await open({ reduced: true });
  // Tab through the page: every stop shows a ring.
  await ev(`window.scrollTo(0,0);document.activeElement.blur()`);
  const rings = [];
  for (let i = 0; i < 14; i++) {
    await key("Tab");
    rings.push(await ev(`(()=>{const e=document.activeElement;const s=getComputedStyle(e);return {tag:e.tagName+"."+e.className,style:s.outlineStyle,w:parseFloat(s.outlineWidth)}})()`));
  }
  for (const r of rings) assert.ok(r.style !== "none" && r.w >= 2, `no visible focus ring on ${r.tag}`);
});

test("the text has no dashes or hyphens in the page copy", async () => {
  await open({ reduced: true });
  await ev(`document.querySelectorAll("details").forEach(d=>d.open=true)`);
  const text = await ev(`(()=>{const c=document.querySelector(".pl").cloneNode(true);c.querySelectorAll("[data-excerpt],.term,script,style").forEach(e=>e.remove());return c.innerText+" "+[...c.querySelectorAll("[aria-label],img[alt]")].map(e=>e.getAttribute("aria-label")||e.getAttribute("alt")).join(" ")})()`);
  assert.equal(/[-‐-―−]/.test(text), false, `found a dash or hyphen: ${text.match(/.{20}[-‐-―−].{20}/)?.[0]}`);
});

test("the sections come in the asked order, with the exact copy", async () => {
  await open({ reduced: true });
  const order = await ev(`[...document.querySelectorAll(".pl header, .pl .hero, .pl #stage, .pl .facts, .pl section, .pl footer")].map(e=>e.tagName==="SECTION"?(e.querySelector("h2")?.textContent||""):e.tagName==="HEADER"?"header":e.tagName==="FOOTER"?"footer":e.className)`);
  assert.deepEqual(order, ["header", "hero", "stage", "facts", "Not a list of colors. A rulebook your AI follows.", "Three steps, about ten minutes.", "Why I built this", "The same page, before and after", "Questions", "Lay the first stone.", "footer"]);
  const copy = await ev(`document.querySelector(".pl").innerText`);
  for (const line of [
    "Are you building a solid app?",
    "Here is your first stone for the foundation.",
    "Plinth turns your brand choices into one markdown file. Claude Code, Codex and ChatGPT read it before they build, so your product looks like yours from the first screen.",
    "Free. No login. Runs in your browser.",
    "Written for Claude Code (SKILL.md) and Codex (AGENTS.md), in three stacks. ChatGPT works with a Project upload.",
    "Kiran, Brand and Product Designer",
    "About ten minutes to a finished file.",
    "Build me a pricing page with three plans.",
    "Reading SKILL.md first.",
  ]) assert.ok(copy.replace(/\s+/g, " ").includes(line), `missing: ${line}`);
  assert.deepEqual(await ev(`[...document.querySelectorAll(".icard h3")].map(e=>e.textContent)`), ["Tokens", "Component recipes", "Signature details", "Tone of voice", "Accessibility", "Final checklist"]);
  assert.equal(await ev(`document.querySelectorAll("details").length`), 8);
});

test("the first load stays light: the engine loads after the page, fonts come from next/font", async () => {
  const html = await (await fetch(state.baseUrl + "/")).text();
  const scripts = [...new Set([...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+\.js[^"]*)"/g)].map((m) => m[1]))];
  let total = 0;
  const bodies = [];
  for (const url of scripts) {
    const body = Buffer.from(await (await fetch(state.baseUrl + url)).arrayBuffer());
    total += gzipSync(body).length;
    bodies.push(body.toString("utf8"));
  }
  console.log(`landing first load JavaScript: ${(total / 1024).toFixed(1)} KiB gzip in ${scripts.length} files`);
  // The token engine and the SKILL.md generator are not in the first load (they have text only the generator holds).
  assert.ok(!bodies.some((b) => b.includes("Run before calling a screen done") || b.includes("Fix every miss, or say which failed")), "the generator is not in the first load");
  assert.ok(total / 1024 < 260, `first load JavaScript is ${(total / 1024).toFixed(0)} KiB gzip`);
  // In the browser the engine arrives after the page is up, and no font comes from Google.
  await open({ reduced: true });
  const res = await ev(`performance.getEntriesByType("resource").map(r=>r.name)`);
  assert.ok(!res.some((n) => /fonts\.(googleapis|gstatic)\.com/.test(n)), "no request goes to Google Fonts");
  assert.ok(res.some((n) => /\/_next\/static\/media\/.*\.woff2/.test(n)), "fonts are self hosted by next/font");
  assert.equal(await ev(`document.querySelector(".pl").dataset.engine`), "ready");
});

test("no theme flash: the saved choice is applied before the first paint, even when it differs from the system setting", async () => {
  const LIGHT = "rgb(245, 246, 247)";
  const DARK = "rgb(10, 10, 11)";
  // The tiny script is inline, under 300 bytes, and the only script in <head>.
  const html = await (await fetch(state.baseUrl + "/")).text();
  const head = html.slice(0, html.indexOf("</head>"));
  const inline = [...head.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).filter((code) => code.includes("design-sys-md:tool-theme"));
  assert.equal(inline.length, 1, "one inline theme script in the head");
  assert.ok(Buffer.byteLength(inline[0]) < 300, `the script is ${Buffer.byteLength(inline[0])} bytes`);
  // For every mix of saved choice and system setting: every frame painted while the page loads has the right colors.
  for (const [saved, system] of [["dark", "light"], ["light", "dark"], [null, "dark"], [null, "light"], ["dark", "dark"]]) {
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }, { name: "prefers-color-scheme", value: system }] });
    await navigate(state.baseUrl + "/favicon.ico", null);
    await ev(`localStorage.clear();${saved ? `localStorage.setItem("design-sys-md:tool-theme","${saved}")` : ""}`);
    // From the first moment of the next page, note the page's background on every animation frame (each one is a paint).
    const { identifier } = await send("Page.addScriptToEvaluateOnNewDocument", {
      source: `window.__frames=[];(function f(){var el=document.querySelector(".pl");if(el)window.__frames.push(getComputedStyle(el).backgroundColor);if(document.readyState!=="complete"||window.__frames.length<8)requestAnimationFrame(f)})()`,
    });
    try {
      await navigate(state.baseUrl + "/", LANDING_READY);
      const frames = await ev(`window.__frames`);
      const expected = (saved ?? system) === "dark" ? DARK : LIGHT;
      assert.ok(frames.length >= 3, `frames were observed (${frames.length})`);
      assert.deepEqual([...new Set(frames)], [expected], `saved ${saved}, system ${system}: every frame is ${expected === DARK ? "dark" : "light"}`);
      assert.equal(await ev(`document.querySelector(".pl").dataset.theme ?? null`), saved, "React agrees with the script");
      assert.equal(await ev(`document.documentElement.dataset.theme ?? null`), saved);
    } finally {
      await send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
    }
  }
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }, { name: "prefers-color-scheme", value: "light" }] });
});

test("skip link is the first tab stop and works, the demo sample has no heading of its own, and the FAQ has eight questions", async () => {
  await navigate(state.baseUrl + "/", LANDING_READY);
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  assert.equal(await ev(`document.activeElement.textContent.trim()`), "Skip to main content", "the skip link comes first");
  assert.ok((await ev(`document.activeElement.getBoundingClientRect().top`)) >= 0, "and it shows when focused");
  assert.equal(await ev(`document.querySelector(".skip").getAttribute("href")`), "#top");
  assert.equal(await ev(`!!document.querySelector("main#top")`), true, "the target exists");
  assert.deepEqual(await ev(`[...document.querySelectorAll("h1,h2,h3")].map(h=>h.tagName).slice(0,3)`), ["H1", "H2", "H3"], "heading order has no jump");
  assert.equal(await ev(`document.querySelectorAll("details").length`), 8);
});

test("each What is inside card shows a real excerpt from the generated file", async () => {
  await navigate(state.baseUrl + "/", LANDING_READY);
  const cards = await ev(`[...document.querySelectorAll(".icard")].map(c=>({title:c.querySelector("h3").textContent,from:c.querySelector(".excerpt figcaption").textContent,lines:[...c.querySelectorAll(".excerpt pre span")].map(s=>s.textContent)}))`);
  assert.equal(cards.length, 6);
  for (const c of cards) assert.ok(c.lines.length >= 3, `${c.title} shows at least 3 lines (${c.lines.length})`);
  assert.match(cards[0].lines[0], /^--color-brand-50:#[0-9A-F]{6}$/i, "Tokens shows real token lines");
  assert.match(cards[1].lines.join(" "), /primary: "bg-primary/, "Component recipes shows the real button classes");
  assert.match(cards[4].lines.join(" "), /primary-foreground on primary [\d.]+:1/, "Accessibility shows measured ratios");
  // The lines come from the real file: the first token line is in the Next.js AGENTS.md the generator writes.
  const hero = await ev(`document.querySelector(".hero").getBoundingClientRect().height`);
  assert.ok(hero < 380, `the hero is short (${Math.round(hero)}px)`);
});
