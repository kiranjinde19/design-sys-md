/**
 * The preview tabs show what an AI would build from the generated skill file, so they use that file's own
 * CSS. This turns the plain HTML/CSS stack's CSS into CSS that applies only inside the preview container
 * (`.pv-skill`), and adds copies of the hover, pressed and focus rules as classes (.is-hover, .is-pressed,
 * .is-focus) so a state can be shown without a mouse.
 */

const SCOPE = ".pv-skill";

/** Splits CSS into its top level rules and at-rules. Comments are dropped. */
function topLevel(css: string): string[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const chunks: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) {
        chunks.push(text.slice(start, i + 1).trim());
        start = i + 1;
      }
    }
  }
  return chunks.filter(Boolean);
}

const STATE_CLASSES: [RegExp, string][] = [
  [/:hover/g, ".is-hover"],
  [/:active/g, ".is-pressed"],
  [/:focus-visible/g, ".is-focus"],
];

/** One selector of a rule, rewritten for the scope, plus a class copy for every state it styles. */
function scopeSelector(selector: string): string[] {
  const s = selector.trim();
  if (s === ":root" || s === "body") return ["&"];
  if (s === ":focus-visible") return ["&:focus-visible", "& :focus-visible", "& .is-focus"];
  if (s.startsWith(":-webkit")) return [`& ${s}`];
  const copies = STATE_CLASSES.map(([pattern, replacement]) => (pattern.test(s) ? s.replace(pattern, replacement) : null)).filter((x): x is string => x !== null);
  // The patterns are global regexes, so test() moves lastIndex. Reset them for the next selector.
  STATE_CLASSES.forEach(([pattern]) => (pattern.lastIndex = 0));
  return [s, ...copies];
}

export function scopeSkillCss(css: string, extra = ""): string {
  const hoisted: string[] = [];
  const nested: string[] = [];
  for (const chunk of topLevel(css)) {
    const head = chunk.slice(0, chunk.indexOf("{")).trim();
    if (head.startsWith("@property") || head.startsWith("@keyframes")) {
      hoisted.push(chunk);
    } else if (head.startsWith("@")) {
      // A media or supports block: its :root rules apply to the scope itself.
      nested.push(chunk.replace(/(^|[{}])\s*:root\s*\{/g, "$1&{"));
    } else {
      const body = chunk.slice(chunk.indexOf("{"));
      nested.push(`${head.split(",").flatMap(scopeSelector).join(",")}${body}`);
    }
  }
  // @keyframes can not live inside a nested rule (the browser drops them), so they come out of the extra CSS too.
  const extraNested: string[] = [];
  for (const chunk of topLevel(extra)) {
    const head = chunk.slice(0, chunk.indexOf("{")).trim();
    (head.startsWith("@keyframes") || head.startsWith("@property") ? hoisted : extraNested).push(chunk);
  }
  return `${hoisted.join("\n")}\n${SCOPE}{\n${nested.join("\n")}\n${extraNested.join("\n")}\n}`;
}

/** Every css code block of a generated skill file, joined. */
export function cssBlocks(skillMarkdown: string): string {
  return [...skillMarkdown.matchAll(/```css\n([\s\S]*?)```/g)].map((m) => m[1]).join("\n");
}
