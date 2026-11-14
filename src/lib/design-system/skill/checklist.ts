import { lines, type SkillContext } from "./context";

export function checklistSection(ctx: SkillContext): string[] {
  const tw = ctx.tailwind;
  return lines(
    "## Final checklist",
    "",
    "Fix every miss, or say which item failed and why.",
    "",
    tw ? "- [ ] No hex, rgb(), `[...]` arbitrary values, default palette colors, or `dark:` classes in the changed files, except rule 1's exceptions (Signature details code, 1px and 2px borders and outlines, breakpoints)." : "- [ ] No hex, rgb(), raw pixel values or dark-mode styles. Only `var(--token)`, except rule 1's exceptions (Signature details code, 1px and 2px borders and outlines, breakpoints).",
    "- [ ] Every Hard rule holds: one accent, one primary button, type, spacing, radius and shadows from their scales, reduced motion, tone of voice.",
    "- [ ] Form controls use the `input` border; cards, dividers and tables use `border`. Numbers are tabular and right aligned. Destructive actions are confirmed.",
    "- [ ] Interactive elements, links included, have hover, active and focus (with the ring) states, and visited for links; where a control can be disabled or can wait, it has disabled and loading states.",
    "- [ ] Signature details applied where relevant: `card`, `card-hover` on clickable and pricing cards, `card-featured` on the one recommended item, `icon-tile`, `divider`, `cta` on at most one action.",
    "- [ ] App screens use the shell; public pages use the public layout. Icons are lucide at the listed sizes, icon-only buttons have an `aria-label`.",
    "- [ ] Every input has a visible label, state is never color alone, text pairs are verified.",
    `- [ ] All copy, titles and meta descriptions included, follows rule 12: ${ctx.stack === "html-css" ? "placeholders stay in the HTML, commented, marked `data-sample`, no JavaScript needed" : "placeholders in one data file"}, all listed in the report.`,
    "- [ ] No element is wider than its container. The logo sits at the left edge of the top bar.",
    ...(ctx.s.colors.roleOverrides && Object.keys(ctx.s.colors.roleOverrides).length ? ["- [ ] Custom roles unchanged."] : []),
    "",
  );
}
