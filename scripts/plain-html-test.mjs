/**
 * Plain HTML recipes, tested the way an AI would use them: the generated plain HTML file is compiled, its CSS and HTML
 * examples are taken straight out of it, and a pricing page and a settings page are built from them and opened in a real
 * headless Chrome with JavaScript turned off. No extra packages and no server (the pages are local files).
 *
 *   npm run test:plain-html
 *
 * Checks at 1280 and 390 wide: no sideways scroll, no child wider than its parent, the brand at the left edge of the top
 * bar and the action at the right, plan buttons inside their cards, and all content and icons visible without JavaScript.
 */

import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ev, navigate, setScripts, setWidth, start, stop, waitFor } from "./lib/cdp.mjs";

const lib = "src/lib/design-system";
const out = mkdtempSync(join(tmpdir(), "dsmd-plain-"));
const site = mkdtempSync(join(tmpdir(), "dsmd-site-"));

/** Compiles the generator and returns the plain HTML AGENTS.md for the default SaaS Clean with a secondary color. */
function generatePlainHtml() {
  try {
    execFileSync("npx", ["tsc", ...["generate", "presets", "normalize", "skill/generate"].map((f) => `${lib}/${f}.ts`), "--outDir", out, "--module", "commonjs", "--moduleResolution", "node", "--target", "es2020", "--skipLibCheck", "--noEmitOnError", "false"], { stdio: "pipe" });
  } catch {
    // tsc exits non-zero on type errors but still writes files; real problems show up as missing files below.
  }
  const require = createRequire(import.meta.url);
  const { createDesignSystem } = require(join(out, "generate.js"));
  const { PRESETS } = require(join(out, "presets.js"));
  const { applyPatch } = require(join(out, "normalize.js"));
  const { generateSkillFile } = require(join(out, "skill/generate.js"));
  const settings = applyPatch(PRESETS["saas-clean"].settings, { colors: { secondary: "#9243CD" }, project: { name: "Acme Billing", description: "Billing software for small teams.", stack: "html-css" } });
  return generateSkillFile(createDesignSystem(settings), { presetId: "saas-clean" }).agents;
}

const md = generatePlainHtml();
const fences = [...md.matchAll(/```(\w+)\n([\s\S]*?)```/g)].map((m) => ({ lang: m[1], body: m[2] }));
const css = fences.filter((f) => f.lang === "css").map((f) => f.body).join("\n");
const htmlExamples = fences.filter((f) => f.lang === "html").map((f) => f.body.trim());
const example = (pattern) => {
  const found = htmlExamples.find((h) => pattern.test(h));
  assert.ok(found, `the file has an HTML example matching ${pattern}`);
  return found;
};
// The icon recipe: an inline SVG with the "…" replaced by a real path.
const svgRecipe = md.match(/`(<svg [^`]*?)…(<\/svg>)`/);
assert.ok(svgRecipe, "the Icons section gives an inline SVG recipe");
const icon = (size) => svgRecipe[1].replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`) + '<path d="M5 12h14"/><path d="M12 5v14"/>' + svgRecipe[2];

const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><link rel="stylesheet" href="styles.css"></head><body>${body}</body></html>`;
const header = example(/<header class="header">/);

const PRICING = page(
  "Pricing",
  `${header}
<main class="page">
  <!-- SAMPLE CONTENT: page title and intro -->
  <section data-sample><h1>Simple pricing</h1><p>Choose a plan that fits. Sample content, replace it with your own.</p></section>
  <!-- SAMPLE CONTENT: plan names, prices, features -->
  <div class="plans" data-sample>
    <article class="card card-hover plan"><span class="icon-tile">${icon(20)}</span><h3>Starter</h3><p class="plan__desc">For trying things out.</p><p><strong>$0</strong> / month</p><hr class="divider"><ul><li>1 project</li><li>Community help</li></ul><a class="btn btn--secondary plan__cta" href="#">Choose Starter</a></article>
    <article class="card card-hover card-featured plan"><span class="icon-tile">${icon(20)}</span><h3>Pro</h3><p class="plan__desc">For a small team that ships every week and wants room to grow without surprises.</p><p><strong>$29</strong> / month</p><hr class="divider"><ul><li>Unlimited projects</li><li>Priority help</li></ul><a class="btn btn--primary cta plan__cta" href="#">Choose Pro</a></article>
    <article class="card card-hover plan"><span class="icon-tile">${icon(20)}</span><h3>Team</h3><p class="plan__desc">For larger groups.</p><p><strong>$79</strong> / month</p><hr class="divider"><ul><li>Everything in Pro</li><li>Roles and access</li></ul><a class="btn btn--secondary plan__cta" href="#">Choose Team</a></article>
  </div>
</main>`,
);

const SETTINGS = page(
  "Settings",
  `<div class="shell">
  <aside class="sidebar"><a class="nav-item" href="#" aria-current="page">${icon(16)} Profile</a><a class="nav-item" href="#">${icon(16)} Billing</a></aside>
  <div class="shell__main">
    ${header}
    <main class="page">
      <h1>Settings</h1>
      <!-- SAMPLE CONTENT: profile form -->
      <section class="card" data-sample><h2><span class="icon-tile">${icon(20)}</span> Profile</h2>${example(/class="form"/)}</section>
      <!-- SAMPLE CONTENT: notification choices -->
      <section class="card" data-sample><h2>Notifications</h2>${example(/class="check"/)}</section>
      <!-- SAMPLE CONTENT: team members -->
      <section class="card" data-sample><h2>Team members</h2>${example(/class="table"/)}</section>
      <!-- SAMPLE CONTENT: metrics -->
      <section data-sample>${example(/class="stats"/)}</section>
    </main>
  </div>
</div>`,
);

before(async () => {
  writeFileSync(join(site, "styles.css"), css);
  writeFileSync(join(site, "pricing.html"), PRICING);
  writeFileSync(join(site, "settings.html"), SETTINGS);
  await start({ needsServer: false });
  // The point of the test: pages must work with JavaScript turned off.
  await setScripts(false);
});
after(stop);

/** Problems found in the open page: sideways scroll, children wider than their parent, things inside their container. */
const PROBLEMS = `(() => {
  const problems = [];
  const win = innerWidth;
  if (document.documentElement.scrollWidth > win) problems.push("the page scrolls sideways: " + document.documentElement.scrollWidth + " in " + win);
  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") continue;
    const cs = getComputedStyle(el);
    if (["none", "contents"].includes(cs.display) || ["absolute", "fixed"].includes(cs.position)) continue;
    const parent = el.parentElement;
    if (!parent || parent === document.body) continue;
    const pcs = getComputedStyle(parent);
    if (["auto", "scroll", "hidden"].includes(pcs.overflowX)) continue;
    const r = el.getBoundingClientRect();
    const p = parent.getBoundingClientRect();
    if (r.width === 0) continue;
    if (r.right > p.right + 1 || r.left < p.left - 1) problems.push(el.tagName.toLowerCase() + "." + el.className + " sticks out of its parent " + parent.tagName.toLowerCase() + "." + parent.className + " (" + Math.round(r.left) + ".." + Math.round(r.right) + " vs " + Math.round(p.left) + ".." + Math.round(p.right) + ")");
    // Full width controls must fit inside the padding of their container, not only inside its border box.
    if (el.matches(".btn, .input, .select, .table") && ["card", "plan", "field", "form"].some((c) => parent.classList.contains(c))) {
      const inner = p.right - parseFloat(pcs.paddingRight) - parseFloat(pcs.borderRightWidth);
      if (r.right > inner + 1) problems.push(el.tagName.toLowerCase() + "." + el.className + " is past the content edge of its container by " + Math.round(r.right - inner) + "px");
    }
  }
  return problems.slice(0, 8);
})()`;

const BAR = `(() => {
  const header = document.querySelector("header.header");
  const hr = header.getBoundingClientRect();
  const hcs = getComputedStyle(header);
  const brand = header.querySelector('a[href="/"]').getBoundingClientRect();
  const action = header.querySelector(".btn").getBoundingClientRect();
  return { padLeft: parseFloat(hcs.paddingLeft), padRight: parseFloat(hcs.paddingRight), headerLeft: hr.left, headerRight: hr.right, brandLeft: brand.left, actionRight: action.right, actionLeft: action.left, brandRight: brand.right, flex: hcs.display, justify: hcs.justifyContent };
})()`;

for (const [name, file] of [["pricing", "pricing.html"], ["settings", "settings.html"]]) {
  for (const width of [1280, 390]) {
    test(`plain HTML ${name} page at ${width}px: no overflow, brand at the left of the top bar, everything visible without JavaScript`, async () => {
      await setWidth(width, 900);
      await navigate(`file://${join(site, file)}`, `document.readyState === "complete"`);
          assert.deepEqual(await ev(PROBLEMS), [], `${name} ${width}: layout problems`);

      // The top bar: a flex row, the brand at the left edge, the action at the right edge.
      const bar = await ev(BAR);
      assert.equal(bar.flex, "flex");
      assert.equal(bar.justify, "space-between", "the top bar spreads its two items");
      assert.ok(Math.abs(bar.brandLeft - (bar.headerLeft + bar.padLeft)) <= 1, `${width}: the brand starts at the left padding edge (${bar.brandLeft} vs ${bar.headerLeft + bar.padLeft})`);
      assert.ok(Math.abs(bar.actionRight - (bar.headerRight - bar.padRight)) <= 1, `${width}: the action ends at the right padding edge`);
      assert.ok(bar.brandRight < bar.actionLeft, `${width}: the brand is left of the action`);

      // JavaScript is off: all content and icons are in the page and visible.
      const visible = await ev(`(() => {
        const text = document.body.innerText;
        const svgs = [...document.querySelectorAll("svg")];
        const samples = [...document.querySelectorAll("[data-sample]")];
        const comments = []; const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT); while (walker.nextNode()) comments.push(walker.currentNode.nodeValue);
        return { text: text.length, svgs: svgs.length, contentSvgs: svgs.filter((s) => !s.closest(".sidebar")).length, contentSvgsVisible: svgs.filter((s) => !s.closest(".sidebar")).filter((s) => { const r = s.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(s).visibility !== "hidden"; }).length, hidden: samples.filter((s) => s.getBoundingClientRect().height === 0).length, samples: samples.length, comments: comments.filter((c) => /SAMPLE CONTENT/.test(c)).length, scripts: document.querySelectorAll("script").length };
      })()`);
      assert.equal(visible.scripts, 0, "the page has no script");
      // Icons in the sidebar are hidden below 768 on purpose (it becomes a menu); every other icon must be visible.
      assert.ok(visible.contentSvgs > 0 && visible.contentSvgsVisible === visible.contentSvgs, `${visible.contentSvgsVisible} of ${visible.contentSvgs} icons in the page content are visible`);
      assert.equal(visible.hidden, 0, "every sample block is visible");
      assert.ok(visible.comments >= visible.samples, `every data-sample block has a SAMPLE CONTENT comment (${visible.comments} comments, ${visible.samples} blocks)`);
      if (name === "pricing") assert.match(await ev(`document.body.innerText`), /Simple pricing[\s\S]*Starter[\s\S]*Pro[\s\S]*Team/);
      else assert.match(await ev(`document.body.innerText`), /Settings[\s\S]*Profile[\s\S]*Team members/);
    });
  }
}

test("plain HTML plan buttons stay inside their cards (box-sizing is border-box everywhere, buttons are full width)", async () => {
  await setWidth(1280, 900);
  await navigate(`file://${join(site, "pricing.html")}`, `document.readyState === "complete"`);
  const m = await ev(`(() => {
    const cards = [...document.querySelectorAll(".plan")];
    return {
      boxSizing: [...document.querySelectorAll(".btn, .plan, .card, .input")].map((e) => getComputedStyle(e).boxSizing),
      buttons: cards.map((c) => { const b = c.querySelector(".plan__cta").getBoundingClientRect(); const r = c.getBoundingClientRect(); const cs = getComputedStyle(c); const inner = { left: r.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth), right: r.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth) }; return { left: b.left - inner.left, right: inner.right - b.right, width: b.width, inner: inner.right - inner.left }; }),
      heights: cards.map((c) => Math.round(c.getBoundingClientRect().height)),
      bottoms: cards.map((c) => Math.round(c.querySelector(".plan__cta").getBoundingClientRect().bottom)),
    };
  })()`);
  assert.ok(m.boxSizing.every((b) => b === "border-box"), "box-sizing is border-box");
  for (const b of m.buttons) {
    assert.ok(Math.abs(b.left) <= 1 && Math.abs(b.right) <= 1, `a plan button fills the content width exactly (${b.left}, ${b.right})`);
    assert.ok(Math.abs(b.width - b.inner) <= 1);
  }
  // The featured card's signature code (2px border, -1px margin) makes it 2px taller on purpose, so its content does not move.
  const spread = (list) => Math.max(...list) - Math.min(...list);
  assert.ok(spread(m.heights) <= 2, `the plan cards are equal height, give or take the featured card's 2px (${m.heights.join(", ")})`);
  assert.ok(spread(m.bottoms) <= 2, `the plan buttons line up at the bottom (${m.bottoms.join(", ")})`);
});

test("plain HTML: every class used in the file's HTML examples is defined by its CSS", () => {
  const defined = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
  const used = new Set();
  for (const html of htmlExamples) for (const m of html.matchAll(/class="([^"]+)"/g)) for (const c of m[1].split(/\s+/)) used.add(c);
  const missing = [...used].filter((c) => !defined.has(c));
  assert.deepEqual(missing, [], "classes used in an example but not defined in the CSS");
});

test("plain HTML: the icon recipe is a static inline SVG (no icon script, font or build step)", () => {
  assert.match(svgRecipe[1], /stroke-width="1\.5"/);
  assert.match(svgRecipe[1], /aria-hidden="true"/);
  assert.match(svgRecipe[1], /viewBox="0 0 24 24"/);
  assert.match(md, /never an icon script, font or build step/);
  assert.ok(!/<script/i.test(md.replace(/```[\s\S]*?```/g, "")), "the prose asks for no script");
  assert.match(md, /Pages work with JavaScript turned off/);
});

test("all three stacks carry the same pixel rule, precedence line, wording and checklist items", () => {
  const require = createRequire(import.meta.url);
  const { createDesignSystem } = require(join(out, "generate.js"));
  const { PRESETS } = require(join(out, "presets.js"));
  const { applyPatch } = require(join(out, "normalize.js"));
  const { generateSkillFile } = require(join(out, "skill/generate.js"));
  for (const stack of ["next-tailwind-shadcn", "react-tailwind", "html-css"]) {
    const settings = applyPatch(PRESETS["saas-clean"].settings, { project: { name: "Acme", stack } });
    const text = generateSkillFile(createDesignSystem(settings), { presetId: "saas-clean" }).agents;
    assert.match(text, /If this file conflicts with the project's own instructions about file layout or tooling, follow the project for structure and this file for every visual value\./, `${stack}: precedence line`);
    assert.match(text, /Exceptions: the Signature details code as written, 1px and 2px border and outline widths, and the breakpoint constants 640, 768, 1024, 1280px\./, `${stack}: rule 1 exceptions`);
    assert.match(text, /except rule 1's exceptions/, `${stack}: the checklist item names them`);
    assert.match(text, /where a control can be disabled or can wait, it has disabled and loading states/, `${stack}: disabled and loading wording`);
    assert.match(text, /No element is wider than its container\. The logo sits at the left edge of the top bar\./, `${stack}: the two new checklist sentences`);
    assert.match(text, /never match the user's name, job or employer/, `${stack}: sample identity rule`);
    assert.match(text, /"Operations lead" or "Support manager"/, `${stack}: safe job titles`);
    if (stack === "html-css") {
      assert.match(text, /marked `data-sample`/);
      assert.ok(!/one clearly marked data file/.test(text), "plain HTML does not ask for a data file");
      assert.match(text, /all CSS lives here/, "one CSS file is stated");
      assert.ok(!/tokens\.css/.test(text), "no second CSS file is mentioned");
    } else {
      assert.match(text, /use sample content in one clearly marked data file/, `${stack}: keeps the data file rule`);
    }
  }
});

// A page that failed to load would make every check above meaningless; wait on a real condition once, at the end.
test("the test pages really loaded their stylesheet", async () => {
  await navigate(`file://${join(site, "pricing.html")}`, `document.readyState === "complete"`);
  await waitFor(`getComputedStyle(document.querySelector("header.header")).display === "flex"`, { label: "the stylesheet to apply" });
});
