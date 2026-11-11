"use client";

import { useMemo, type ReactNode } from "react";
import { generateSkillFile, useDesignSystem } from "@/lib/design-system";
import { cssBlocks, scopeSkillCss } from "./skill-css";
import { EXTRA_CSS } from "./extra-css";

/**
 * The container for the preview tabs that are built from the generated skill file. It receives the user's
 * design system as the CSS the skill file itself contains, scoped so nothing outside it changes.
 */
export function SkillScope({ children }: { children: ReactNode }) {
  const { settings, tokens, presetId } = useDesignSystem();
  const css = useMemo(() => {
    const file = generateSkillFile({ settings, tokens }, { stack: "html-css", presetId });
    return scopeSkillCss(cssBlocks(file.skill), EXTRA_CSS);
  }, [settings, tokens, presetId]);

  return (
    // The controls are live: they take focus, typing and clicks. Only a form submit (which would reload the page) and a
    // link jump are stopped. A mouse click leaves no focus ring because the CSS only draws one for :focus-visible.
    <div className="pv-skill" style={{ minHeight: "100%", ["--pvx-brand-text" as string]: tokens.colors.brandReport.text }} onSubmit={(event) => event.preventDefault()}>
      <style>{css}</style>
      {children}
    </div>
  );
}
