/**
 * The 404 page, the error pages and the basic SEO, in a real headless Chrome against a production build.
 *
 *   node --test scripts/site-test.mjs      (or npm run test:fast)
 *
 * The error pages are reached through two pages that break on purpose (/test-crash and /app/test-crash). They exist only when
 * the server is started with PLINTH_TEST_ROUTES=1 (the test runner does that); one test starts a second server without it and
 * checks that they are plain 404s there, like in production.
 */

import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ev, navigate, reachable, send, sleep, start, state, stop, waitFor } from "./lib/cdp.mjs";

before(async () => {
  await start({ width: 1280, height: 900 });
});
after(() => stop());

const open = async (path, ready = `document.readyState === "complete"`) => {
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }, { name: "prefers-color-scheme", value: "light" }] });
  await navigate(state.baseUrl + path, ready);
};

/** What both kinds of status page must look like: wordmark, square corners, landing type, no dashes. */
async function assertStatusLook(label) {
  assert.equal(await ev(`document.querySelectorAll("[data-status-page] header svg path").length`), 6, `${label}: the wordmark`);
  assert.equal(await ev(`document.querySelector("[data-status-page] header a").getAttribute("aria-label")`), "Plinth home");
  assert.equal(await ev(`document.querySelector("[data-status-page] header a").getAttribute("href")`), "/");
  const round = await ev(`[...document.querySelectorAll("[data-status-page] *")].filter(e=>{const s=getComputedStyle(e);return [s.borderTopLeftRadius,s.borderTopRightRadius,s.borderBottomLeftRadius,s.borderBottomRightRadius].some(v=>v!=="0px")}).length`);
  assert.equal(round, 0, `${label}: every corner is square`);
  assert.match(await ev(`getComputedStyle(document.querySelector("[data-status-page] h1")).fontFamily`), /instrument/i, `${label}: the landing page type`);
  const text = await ev(`document.querySelector("[data-status-page]").innerText + " " + [...document.querySelectorAll("[data-status-page] [aria-label]")].map(e=>e.getAttribute("aria-label")).join(" ")`);
  assert.equal(/[-\u2010-\u2015\u2212]/.test(text), false, `${label}: no dashes or hyphens in the copy`);
  const sizes = await ev(`(()=>{const h=getComputedStyle(document.querySelector("[data-status-page] h1"));const b=[...document.querySelectorAll("[data-status-page] a.st-btn,[data-status-page] button.st-btn,[data-status-page] a.st-link")].map(e=>Math.round(e.getBoundingClientRect().height));return {fs:parseFloat(h.fontSize),lh:parseFloat(h.lineHeight)/parseFloat(h.fontSize),b}})()`);
  assert.ok(sizes.fs <= 58 && sizes.lh >= 1.09 && sizes.lh <= 1.21, `${label}: title ${sizes.fs}px, line height ${sizes.lh}`);
  assert.ok(sizes.b.length >= 1 && sizes.b.every((h) => h >= 44), `${label}: tap targets at least 44px (${sizes.b.join(", ")})`);
}

test("a missing address, and the old debug addresses, show the 404 page with a 404 status", async () => {
  for (const path of ["/this-page-is-not-here", "/app/nope", "/debug", "/debug/skill", "/debug/skill/react-tailwind", "/debug/skill/html-css"]) {
    const response = await fetch(state.baseUrl + path);
    assert.equal(response.status, 404, path);
    const html = await response.text();
    assert.ok(html.includes("This page does not exist"), `${path}: the 404 page`);
    assert.match(html, /<meta name="robots" content="noindex/, `${path}: not indexed`);
  }
  await open("/debug/skill");
  assert.equal(await ev(`document.title`), "Plinth: page not found");
  assert.equal(await ev(`document.querySelector("h1").textContent`), "This page does not exist");
  assert.equal(await ev(`document.querySelector(".st-line").textContent`), "The link may be old or mistyped.");
  assert.deepEqual(await ev(`[...document.querySelectorAll(".st-actions a")].map(a=>[a.textContent.trim(),a.getAttribute("href")])`), [["Go to the home page", "/"], ["Open Plinth", "/app"]]);
  await assertStatusLook("404");
  await ev(`[...document.querySelectorAll(".st-actions a")][1].click()`);
  await waitFor(`location.pathname === "/app"`, { label: "the tool" });
  await open("/nothing-here");
  await ev(`[...document.querySelectorAll(".st-actions a")][0].click()`);
  await waitFor(`location.pathname === "/" && !!document.querySelector(".pl")`, { label: "the landing page" });
});

test("the error page: title, one line, Try again and Send feedback, on both sides of the app", async () => {
  // The feedback link is the landing page's own link: one address, written once.
  await open("/");
  const feedback = await ev(`document.querySelector("footer a").getAttribute("href")`);
  assert.match(feedback, /^mailto:[^?]+\?subject=Plinth%20feedback$/);
  for (const path of ["/test-crash", "/app/test-crash"]) {
    await open(path, `!!document.querySelector("[data-status-page]")`);
    assert.equal(await ev(`document.querySelector("h1").textContent`), "Something went wrong", path);
    assert.equal(await ev(`document.querySelector(".st-line").textContent`), "Your work in the tool is saved in this browser. Try again, and if it keeps happening, send feedback.");
    assert.equal(await ev(`[...document.querySelectorAll(".st-actions button")].map(b=>b.textContent.trim()).join("|")`), "Try again");
    assert.equal(await ev(`document.querySelector(".st-actions a").textContent`), "Send feedback");
    assert.equal(await ev(`document.querySelector(".st-actions a").getAttribute("href")`), feedback, "the same link as the landing page");
    await assertStatusLook(`error ${path}`);
    // Try again really tries again: the page that breaks on purpose breaks again, and the page stays standing.
    await ev(`document.querySelector(".st-actions button").click()`);
    await sleep(600); // elapsed time is the thing measured: a page that fell over would show it in this time
    assert.equal(await ev(`document.querySelector("h1")?.textContent`), "Something went wrong", `${path}: still standing after Try again`);
  }
});

test("a global error page and a global 404 page exist and use the same views", () => {
  const globalError = readFileSync("src/app/global-error.tsx", "utf8");
  assert.match(globalError, /"use client"/);
  assert.match(globalError, /<html/);
  assert.match(globalError, /ErrorView/);
  assert.match(readFileSync("src/app/global-not-found.tsx", "utf8"), /NotFoundView/);
  assert.match(readFileSync("next.config.ts", "utf8"), /globalNotFound: true/);
  for (const group of ["(site)", "(tool)"]) assert.match(readFileSync(`src/app/${group}/error.tsx`, "utf8"), /ErrorView/, `${group} has an error page`);
});

test("the pages that break on purpose are plain 404s when the server is not started for tests", async () => {
  const port = 3124;
  const server = spawn("npx", ["next", "start", "-p", String(port)], { stdio: "ignore", env: { ...process.env, PLINTH_TEST_ROUTES: "" } });
  try {
    await waitFor(async () => reachable(`http://localhost:${port}/app`), { timeout: 20000, label: "a second server" });
    for (const path of ["/test-crash", "/app/test-crash"]) {
      const response = await fetch(`http://localhost:${port}${path}`);
      assert.equal(response.status, 404, path);
      assert.ok((await response.text()).includes("This page does not exist"), `${path}: the 404 page`);
    }
  } finally {
    server.kill();
    execFileSync("sh", ["-c", `lsof -ti tcp:${port} -sTCP:LISTEN | xargs kill 2>/dev/null || true`]);
  }
});

test("SEO: canonical links, titles and descriptions, robots.txt and sitemap.xml, no tracking", async () => {
  const get = async (path) => (await fetch(state.baseUrl + path)).text();
  const tag = (html, re) => re.exec(html)?.[1];
  const home = await get("/");
  const app = await get("/app");
  const exportPage = await get("/app/export");
  assert.match(tag(home, /<link rel="canonical" href="([^"]+)"/), /^https?:\/\/[^/]+\/?$/);
  assert.match(tag(app, /<link rel="canonical" href="([^"]+)"/), /^https?:\/\/[^/]+\/app$/);
  assert.equal(tag(home, /<title>([^<]*)</), "Plinth: your brand design system as one SKILL.md file");
  assert.equal(tag(app, /<title>([^<]*)</), "Plinth: build your design system");
  assert.match(tag(app, /<meta name="description" content="([^"]+)"/), /^Build your brand design system with sliders, pickers and drag and drop/);
  assert.notEqual(tag(app, /<meta name="description" content="([^"]+)"/), tag(home, /<meta name="description" content="([^"]+)"/), "the tool has its own description");
  assert.match(tag(app, /<meta property="og:image" content="([^"]+)"/), /^https?:\/\/.+\/brand\/plinth-share\.png$/);
  assert.match(exportPage, /<meta name="robots" content="noindex/, "the Export screen is not listed on its own");
  const robots = await get("/robots.txt");
  assert.match(robots, /user.agent: \*/i);
  assert.match(robots, /Allow: \//);
  const origin = new URL(tag(home, /<link rel="canonical" href="([^"]+)"/)).origin;
  assert.match(robots, new RegExp(`Sitemap: ${origin.replace(/[.]/g, "\\.")}/sitemap\\.xml`));
  const sitemap = await get("/sitemap.xml");
  assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]), [`${origin}/`, `${origin}/app`]);
  assert.equal(new URL(tag(home, /<link rel="canonical" href="([^"]+)"/)).pathname, "/", "the canonical address of the landing page is the root");
  // No tracking: no script from another host, no analytics words in the page.
  for (const html of [home, app]) {
    assert.deepEqual([...html.matchAll(/<script[^>]+src="(https?:\/\/[^"]+)"/g)].map((m) => m[1]), [], "no external script");
    assert.equal(/google-analytics|googletagmanager|gtag\(|plausible|segment\.com|hotjar|mixpanel|vercel\/analytics|_vercel\/insights/i.test(html), false, "no analytics");
  }
});

test("the address comes from NEXT_PUBLIC_SITE_URL, then VERCEL_PROJECT_PRODUCTION_URL, then localhost", () => {
  const out = mkdtempSync(join(tmpdir(), "dsmd-site-"));
  try {
    execFileSync("npx", ["tsc", "src/lib/site.ts", "--outDir", out, "--module", "commonjs", "--moduleResolution", "node", "--target", "es2020", "--skipLibCheck"], { stdio: "pipe" });
  } catch {
    // tsc exits non-zero on type errors but still writes files.
  }
  const { siteUrl } = createRequire(import.meta.url)(join(out, "site.js"));
  const withEnv = (env) => {
    const keep = { a: process.env.NEXT_PUBLIC_SITE_URL, b: process.env.VERCEL_PROJECT_PRODUCTION_URL };
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    Object.assign(process.env, env);
    try {
      return siteUrl().toString();
    } finally {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      if (keep.a !== undefined) process.env.NEXT_PUBLIC_SITE_URL = keep.a;
      if (keep.b !== undefined) process.env.VERCEL_PROJECT_PRODUCTION_URL = keep.b;
    }
  };
  assert.equal(withEnv({ NEXT_PUBLIC_SITE_URL: "https://plinth.example", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" }), "https://plinth.example/");
  assert.equal(withEnv({ VERCEL_PROJECT_PRODUCTION_URL: "plinth.vercel.app" }), "https://plinth.vercel.app/");
  assert.equal(withEnv({ NEXT_PUBLIC_SITE_URL: "plinth.example" }), "https://plinth.example/", "a bare domain gets https");
  assert.equal(withEnv({}), "http://localhost:3000/");
});
