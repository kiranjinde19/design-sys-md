/**
 * Shared helper for the real-browser tests: starts a headless Chrome, talks to it over the DevTools protocol, and waits for
 * real conditions instead of fixed pauses. No extra packages. Each test file runs in its own process, so this keeps one
 * browser session per file.
 *
 *   waitFor(expression)   polls a page expression until it is truthy (or fails with a clear message after the timeout)
 *   settle()              waits until the page has painted twice and its layout observers have run
 *   navigate(url, ready)  loads a page and waits for the load event and for the `ready` expression
 */

import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

let ws = null;
let chrome = null;
let server = null;
let nextId = 0;
const pending = new Map();
export const state = { baseUrl: process.env.LIVE_URL ?? "http://localhost:3000", scriptsDisabled: false };

export const reachable = async (url) => {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(2000) })).ok;
  } catch {
    return false;
  }
};

export const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

/** Evaluates an expression in the page (awaiting promises) and returns its value. A page error fails with the expression. */
export async function ev(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(`Page error: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}\n${expression}`);
  return r.result?.value;
}

/** Polls until `condition` (a page expression, or an async function) is truthy. Returns its value. */
export async function waitFor(condition, { timeout = 10000, label = "" } = {}) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeout) {
    try {
      last = typeof condition === "function" ? await condition() : await ev(condition);
      if (last) return last;
    } catch (error) {
      last = error;
    }
    await sleep(40);
  }
  throw new Error(`Timed out after ${timeout}ms waiting for ${label || (typeof condition === "string" ? condition.slice(0, 160) : "a condition")}${last instanceof Error ? ` (${last.message.split("\n")[0]})` : ""}`);
}

/** Two painted frames and a turn of the event loop: layout observers, state updates and transitions have had their turn. */
export const settle = () => (state.scriptsDisabled ? sleep(150) : ev(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 0))))`));

/** Turns page JavaScript on or off (the pages are still laid out; timers and animation frames do not run when it is off). */
export async function setScripts(enabled) {
  state.scriptsDisabled = !enabled;
  await send("Emulation.setScriptExecutionDisabled", { value: !enabled });
}

const APP_READY = `document.readyState === "complete" && !!document.querySelector(".tool[data-ready]") && !/Loading your saved work/.test(document.body.innerText)`;

/**
 * Loads a page and waits for a new, complete document and for `ready`. The old document is marked first, so the wait never
 * mistakes it for the new one. (The load event is not used: Chrome does not send it when scripts are turned off.)
 * Default `ready` is the tool being drawn with its saved work.
 */
export async function navigate(url, ready = APP_READY) {
  await ev(`document.documentElement.setAttribute("data-old-document", "1")`).catch(() => {});
  const result = await send("Page.navigate", { url });
  if (result?.errorText) throw new Error(`Could not open ${url}: ${result.errorText}`);
  await waitFor(`!document.documentElement.hasAttribute("data-old-document") && document.readyState === "complete"`, { label: `${url} to load` });
  if (ready) await waitFor(ready, { label: `${url} to be ready` });
  await settle();
}

/** Starts the app server when none answers (a production build must exist), then Chrome. */
export async function start({ width = 1440, height = 1000, needsServer = true } = {}) {
  if (needsServer && !process.env.LIVE_URL && !(await reachable(state.baseUrl))) {
    state.baseUrl = "http://localhost:3123";
    server = spawn("npx", ["next", "start", "-p", "3123"], { stdio: "ignore" });
    for (let i = 0; i < 60 && !(await reachable(state.baseUrl + "/app")); i++) await sleep(500);
  }
  if (needsServer && !(await reachable(state.baseUrl + "/app"))) throw new Error(`no server at ${state.baseUrl}`);
  const port = 9200 + Math.floor(Math.random() * 700);
  chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, "--disable-gpu", `--window-size=${width},${height}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "dsmd-chrome-"))}`, "about:blank"], { stdio: "ignore" });
  const target = await waitFor(
    async () => {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      return list.find((t) => t.type === "page");
    },
    { timeout: 20000, label: "Chrome to start" },
  );
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
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
  await setWidth(width, height);
}

export function stop() {
  try {
    ws?.close();
  } catch {
    // Already closed.
  }
  chrome?.kill();
  server?.kill();
}

/** Sets the window size and waits until the page really has that width and has re-laid out. */
export async function setWidth(width, height = 900, { scale = 1 } = {}) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile: false });
  await waitFor(`innerWidth === ${width}`, { label: `the window to be ${width}px wide` });
  await settle();
}

/** Clean browser state, the tool theme, an optional open editor, then the page. */
export async function fresh(path, { theme = "light", editor = null } = {}) {
  await navigate(state.baseUrl + "/favicon.ico", null);
  await ev(`localStorage.clear();sessionStorage.clear();localStorage.setItem("design-sys-md:tool-theme","${theme}");${editor ? `sessionStorage.setItem("design-sys-md:open-editor","${editor}")` : ""}`);
  await navigate(state.baseUrl + path);
}

/**
 * Chooses a file through the page's real file input (the one the Choose file and Import file buttons open) and waits for the
 * import to finish: the input counts finished imports in `data-imports`, so the same file twice still counts.
 */
export async function importFile(path) {
  const before = Number(await ev(`document.querySelector('input[type=file]').dataset.imports ?? 0`));
  const r = await send("Runtime.evaluate", { expression: `document.querySelector('input[type=file]')` });
  await send("DOM.setFileInputFiles", { files: [path], objectId: r.result.objectId });
  await waitFor(`Number(document.querySelector('input[type=file]').dataset.imports ?? 0) > ${before}`, { label: "the import to finish" });
  await settle();
}
