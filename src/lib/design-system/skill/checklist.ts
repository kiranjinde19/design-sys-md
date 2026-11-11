import { lines, type SkillContext } from "./context";

export function checklistSection(ctx: SkillContext): string[] {
  const tw = ctx.tailwind;
  return lines(
    "## Final checklist",
    "",
    "Run this before calling a screen done. Fix every miss, or say which item failed and why.",
    "",
    tw ? "- [ ] No hex, rgb(), `[...]` arbitrary values, default palette colors, or `dark:` classes in the changed files." : "- [ ] No hex, rgb(), raw pixel values or dark-mode styles. Only `var(--token)`.",
    "- [ ] Colors are roles or scale steps, one accent, status colors only for status. One primary button; destructive actions are confirmed.",
    "- [ ] Type, spacing, radius and shadows come from their scales, one radius per family, nothing under 12px.",
    "- [ ] Form controls use the `input` border; cards, dividers and tables use `border`. Numbers are tabular and right aligned.",
    "- [ ] Interactive elements have hover, active, focus (with the ring) and disabled states, plus loading if they can wait.",
    "- [ ] Signature details applied where relevant: `card`, `card-hover` on clickable and pricing cards, `card-featured` on the one recommended item, `icon-tile`, `divider`, `cta` on at most one action.",
    "- [ ] App screens use the shell; public pages use the public layout. Icons are lucide at the listed sizes, icon-only buttons have an `aria-label`.",
    "- [ ] Reduced-motion fallback, verified text pairs, a visible label on every input, state never color alone.",
    "- [ ] Copy follows Tone of voice. No invented design values (colors, sizes, fonts, radii). Placeholders sit in one data file and are listed in the report.",
    "",
  );
}
