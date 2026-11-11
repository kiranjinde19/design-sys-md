import { lines, type SkillContext } from "./context";

export function checklistSection(ctx: SkillContext): string[] {
  const tw = ctx.tailwind;
  return lines(
    "## Final checklist",
    "",
    "Run this before calling a screen done. Fix every miss, or say which item failed and why.",
    "",
    tw ? "- [ ] No hex, rgb(), `[...]` arbitrary values, default palette colors, or `dark:` classes in the changed files." : "- [ ] No hex, rgb(), raw pixel values or dark-mode styles. Only `var(--token)`.",
    "- [ ] Every Hard rule holds: one accent, one primary button, type, spacing, radius and shadows from their scales, reduced motion, tone of voice.",
    "- [ ] Form controls use the `input` border; cards, dividers and tables use `border`. Numbers are tabular and right aligned. Destructive actions are confirmed.",
    "- [ ] Interactive elements, links included, have hover, active, focus (with the ring) and disabled states (visited for links), plus loading if they can wait.",
    "- [ ] Signature details applied where relevant: `card`, `card-hover` on clickable and pricing cards, `card-featured` on the one recommended item, `icon-tile`, `divider`, `cta` on at most one action.",
    "- [ ] App screens use the shell; public pages use the public layout. Icons are lucide at the listed sizes, icon-only buttons have an `aria-label`.",
    "- [ ] Every input has a visible label, state is never color alone, text pairs are verified.",
    "- [ ] All copy, titles and meta descriptions included, follows rule 12: placeholders in one data file, every placeholder and inert link or button listed in the report.",
    "",
  );
}
