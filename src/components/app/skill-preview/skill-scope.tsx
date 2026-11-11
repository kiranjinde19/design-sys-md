"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
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

  // This is a preview, not a form: nothing in it takes keyboard focus or submits.
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelectorAll<HTMLElement>("button, input, select, textarea, a").forEach((element) => (element.tabIndex = -1));
  });

  return (
    <div ref={ref} className="pv-skill" style={{ minHeight: "100%" }} onSubmit={(event) => event.preventDefault()} onMouseDown={(event) => event.preventDefault()}>
      <style>{css}</style>
      {children}
    </div>
  );
}
