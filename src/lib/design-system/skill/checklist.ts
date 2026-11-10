import { lines, type SkillContext } from "./context";

export function checklistSection(ctx: SkillContext): string[] {
  const tw = ctx.tailwind;
  return lines(
    "## Final checklist",
    "",
    "Run this before calling a screen done. Fix every miss, or say which item failed and why.",
    "",
    tw ? "- [ ] No hex, rgb(), `[...]` arbitrary values, default palette colors, or `dark:` classes in the changed files." : "- [ ] No hex, rgb(), raw pixel values or dark-mode styles. Only `var(--token)`.",
    "- [ ] Colors are roles or scale steps. One accent color. Status colors only for status.",
    "- [ ] One primary button. Destructive actions are confirmed.",
    "- [ ] Type, spacing, radius and shadows come from their scales, with one radius per family. Nothing under 12px.",
    "- [ ] Form controls use the `input` border; cards, dividers and tables use `border`. Numbers use tabular figures, right aligned.",
    "- [ ] Interactive elements have hover, active, focus (with the ring) and disabled states, plus loading if they can wait. Selection controls fit their job.",
    "- [ ] Signature details applied: `card`, `card-hover` on clickable and pricing cards, `card-featured` on the one recommended item, `icon-tile`, `divider`, `cta` on at most one action.",
    "- [ ] Layout uses the shell, content width and page padding. Icons are lucide at the listed sizes, icon-only buttons have an `aria-label`.",
    "- [ ] Motion has a reduced-motion fallback. Text pairs are verified. State is never color alone. Every input has a visible label.",
    "- [ ] Copy follows Tone of voice, and nothing is invented.",
    "",
  );
}
