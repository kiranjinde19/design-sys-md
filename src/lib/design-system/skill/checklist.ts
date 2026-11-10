import { lines, type SkillContext } from "./context";

export function checklistSection(ctx: SkillContext): string[] {
  const { typography } = ctx.t;
  const tw = ctx.tailwind;
  return lines(
    "## 7. Final checklist",
    "",
    "Run this before you call a screen finished. Fix every miss, or say which item failed and why.",
    "",
    tw
      ? "- [ ] No hex, rgb(), `[...]` arbitrary values, or default Tailwind palette colors (`blue-500`) anywhere in the changed files."
      : "- [ ] No hex, rgb() or raw pixel value in any component. Only `var(--token)`.",
    "- [ ] Every color is a role (`background`, `primary`, `muted`...) or a scale step (`brand-600`, `neutral-200`).",
    `- [ ] Exactly one primary button in the view. Destructive actions are confirmed.`,
    "- [ ] One accent color on the screen. Status colors only for status.",
    `- [ ] Text sizes come from the type scale and none is below ${typography.sizes[0].px}px. Headings use the heading font and its tracking.`,
    "- [ ] Spacing, radius and shadow values come from their scales. One radius per component family.",
    "- [ ] Form controls use the `input` border. Cards, dividers and tables use the `border` token.",
    "- [ ] Every interactive element has hover, active, focus (with the ring), disabled and, if it can wait, loading states.",
    "- [ ] Selection controls are right: radio for one of few, checkbox for submit, switch for instant settings.",
    "- [ ] Numbers in tables, dashboards and prices use tabular figures and are right aligned.",
    "- [ ] Signature details are applied: card style, hover, featured item, icon tiles, divider, and `cta` on one primary action at most.",
    "- [ ] Animations have a `prefers-reduced-motion` fallback.",
    "- [ ] Text and background pairs are from the verified list. Errors and status are not color alone.",
    "- [ ] Every input has a visible label. Icon-only buttons have names. Images have alt text.",
    "- [ ] All copy follows the Tone of voice: button labels name the action, errors say what to do, empty states say what belongs here.",
    "- [ ] Nothing is invented. Anything not covered here was derived from the tokens or asked about.",
    "",
  );
}
