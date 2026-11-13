/**
 * Takes the responsive screenshots: the board, the Colors editor and the Export view at 1920, 1440, 1280, 1024, 768 and
 * 390 wide, in light and dark. A real headless Chrome, no extra packages.
 *
 *   node scripts/screenshots.mjs [outDir] [baseUrl]
 *   (defaults: design/screenshots/responsive, http://localhost:3000)
 */
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const out = process.argv[2] ?? "design/screenshots/responsive";
const base = process.argv[3] ?? "http://localhost:3000";
const WIDTHS = [1920, 1440, 1280, 1024, 768, 390];
const STATES = { board: "/app", editor: "/app", export: "/app/export" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(out, { recursive: true });

const PORT = 9400 + Math.floor(Math.random() * 300);
const chrome = spawn(process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${PORT}`, "--disable-gpu", `--user-data-dir=${mkdtempSync(join(tmpdir(), "shots-"))}`, "about:blank"], { stdio: "ignore" });
let target;
for (let i = 0; i < 60 && !target; i++) {
  await sleep(300);
  try {
    target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === "page");
  } catch {
    // Chrome is still starting.
  }
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result ?? m.error);
    pending.delete(m.id);
  }
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.value;
await send("Page.enable");

for (const theme of ["light", "dark"]) {
  for (const [state, path] of Object.entries(STATES)) {
    for (const width of WIDTHS) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
      await send("Page.navigate", { url: base + "/favicon.ico" });
      await sleep(400);
      await ev(`localStorage.clear();sessionStorage.clear();localStorage.setItem("design-sys-md:tool-theme","${theme}");${state === "editor" ? `sessionStorage.setItem("design-sys-md:open-editor","colors")` : ""}`);
      await send("Page.navigate", { url: base + path });
      await sleep(2800);
      const height = await ev(`document.documentElement.scrollHeight`);
      const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 72, captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: Math.min(height, 3600), scale: 1 } });
      writeFileSync(join(out, `${state}-${theme}-${width}.jpg`), Buffer.from(shot.data, "base64"));
      console.log(state, theme, width, `${height}px tall`);
    }
  }
}
ws.close();
chrome.kill();
