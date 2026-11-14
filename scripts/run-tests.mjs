/**
 * Runs the test suites with a timeout on every test and on the whole run.
 *
 *   npm run test:fast     the quick suite (about 1.5 minutes): the round trip tests, the plain HTML recipes, the Export
 *                         screen, the live behavior of the tool and the responsive checks that do not loop over every width
 *   npm run test:full     everything (about 2.5 minutes): the fast suite plus the slow responsive checks
 *   npm run test:live     the same as test:full (the name CLAUDE.md uses)
 *
 * Each test is stopped after 60 seconds, a fast run after 4 minutes and a full run after 8 minutes in total. The browser
 * tests need a production build (`npm run build`). The runner starts `next start` on port 3123 for the run, so the tests
 * always see the production build. To test another server, set LIVE_URL (for example LIVE_URL=http://localhost:3124).
 */

import { spawn } from "node:child_process";
import { createWriteStream, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const mode = process.argv[2] === "fast" ? "fast" : "full";
const TOTAL_TIMEOUT_MS = (mode === "fast" ? 4 : 8) * 60 * 1000;
const TEST_TIMEOUT_MS = 60 * 1000;

/** The slowest responsive checks: every width in every editor, every tab, every view in light and dark. */
const SLOW_RESPONSIVE = ["no horizontal page scroll on the board", "no horizontal page scroll in any of the nine editors", "no horizontal page scroll on the Export view"];

const STEPS = [
  { name: "round trip", files: ["scripts/roundtrip-test.mjs"], browser: false },
  { name: "plain HTML recipes", files: ["scripts/plain-html-test.mjs"], browser: false },
  { name: "Export screen", files: ["scripts/export-test.mjs"], browser: true },
  { name: "live behavior", files: ["scripts/live-behavior-test.mjs"], browser: true },
  { name: "responsive (quick checks)", files: ["scripts/responsive-test.mjs"], browser: true, skip: SLOW_RESPONSIVE },
  ...(mode === "full" ? [{ name: "responsive (every width)", files: ["scripts/responsive-test.mjs"], browser: true, only: SLOW_RESPONSIVE }] : []),
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const reachable = async (url) => {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(2000) })).ok;
  } catch {
    return false;
  }
};

const logPath = join(tmpdir(), `design-sys-md-${mode}-tests.log`);
const log = createWriteStream(logPath);
let server = null;
let child = null;
let timedOut = false;

const timer = setTimeout(() => {
  timedOut = true;
  console.error(`\nStopped: the ${mode} run took longer than ${TOTAL_TIMEOUT_MS / 60000} minutes in total.`);
  child?.kill("SIGKILL");
  server?.kill();
}, TOTAL_TIMEOUT_MS);

async function ensureServer() {
  if (process.env.LIVE_URL) {
    if (!(await reachable(process.env.LIVE_URL + "/app"))) throw new Error(`No server answers at ${process.env.LIVE_URL}.`);
    return;
  }
  if (!existsSync(".next/BUILD_ID")) throw new Error("There is no production build. Run `npm run build` first.");
  if (await reachable("http://localhost:3123/app")) throw new Error("Port 3123 is already in use. Stop that server, or set LIVE_URL to use it.");
  server = spawn("npx", ["next", "start", "-p", "3123"], { stdio: "ignore" });
  for (let i = 0; i < 60 && !(await reachable("http://localhost:3123/app")); i++) await sleep(500);
  if (!(await reachable("http://localhost:3123/app"))) throw new Error("`next start` did not come up on port 3123.");
  process.env.LIVE_URL = "http://localhost:3123";
}

function runStep(step) {
  return new Promise((resolve) => {
    const args = ["--test", `--test-timeout=${TEST_TIMEOUT_MS}`, "--test-concurrency=1"];
    if (step.skip) args.push(...step.skip.map((name) => `--test-skip-pattern=${escapeRegex(name)}`));
    if (step.only) args.push(...step.only.map((name) => `--test-name-pattern=${escapeRegex(name)}`));
    args.push(...step.files);
    const started = Date.now();
    let output = "";
    child = spawn("node", args, { env: process.env });
    child.stdout.on("data", (chunk) => {
      output += chunk;
      log.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
      log.write(chunk);
    });
    child.on("close", (code) => {
      const count = (label) => Number(output.match(new RegExp(`^ℹ ${label} (\\d+)`, "m"))?.[1] ?? 0);
      const failures = [...new Set([...output.matchAll(/^✖ (.+?) \(\d+(?:\.\d+)?ms\)$/gm)].map((m) => m[1]))].filter((name) => !name.startsWith("failing tests"));
      resolve({ step, code, seconds: (Date.now() - started) / 1000, tests: count("tests"), pass: count("pass"), fail: count("fail"), failures });
    });
  });
}

const results = [];
try {
  if (STEPS.some((step) => step.browser)) await ensureServer();
  for (const step of STEPS) {
    if (timedOut) break;
    process.stdout.write(`${step.name} ... `);
    const result = await runStep(step);
    results.push(result);
    console.log(`${result.fail === 0 && result.code === 0 ? "ok" : "FAILED"}: ${result.pass} of ${result.tests} passed in ${result.seconds.toFixed(0)}s`);
    for (const name of result.failures) console.log(`    failed: ${name}`);
  }
} catch (error) {
  console.error(String(error.message ?? error));
  process.exitCode = 1;
} finally {
  clearTimeout(timer);
  server?.kill();
  log.end();
}

const tests = results.reduce((sum, r) => sum + r.tests, 0);
const pass = results.reduce((sum, r) => sum + r.pass, 0);
const seconds = results.reduce((sum, r) => sum + r.seconds, 0);
const failed = results.some((r) => r.fail > 0 || r.code !== 0) || timedOut;
console.log(`\n${mode} suite: ${pass} of ${tests} tests passed in ${(seconds / 60).toFixed(1)} minutes${failed ? ", with failures" : ""}. Full log: ${logPath}`);
process.exit(failed || process.exitCode ? 1 : 0);
