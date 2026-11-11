"use client";

import { useState } from "react";
import { ButtonsTab } from "./skill-preview/buttons-tab";
import { FormsTab } from "./skill-preview/forms-tab";
import { ScaledStage } from "./scaled-stage";
import { SkillScope } from "./skill-preview/skill-scope";
import { TablesTab } from "./skill-preview/tables-tab";
import { cn } from "@/lib/utils";
import { useDesignSystem } from "@/lib/design-system";
import { PricingPreview } from "./pricing-preview";
import { previewVars } from "./preview-vars";
import "./preview.css";

const SCALE = 0.65;
const TAB_KEY = "design-sys-md:preview-tab";
const TABS = ["Pricing", "Buttons and states", "Forms", "Tables", "Dashboard", "Charts"] as const;

function readTab(): (typeof TABS)[number] {
  try {
    const saved = window.localStorage.getItem(TAB_KEY);
    return TABS.find((name) => name === saved) ?? "Pricing";
  } catch {
    return "Pricing";
  }
}

/** The live preview tile: tabs, a framed stage at 65% scale, and a footer of small token chips. */
export function Preview() {
  const { tokens } = useDesignSystem();
  // The selected tab is remembered while editing (and between visits).
  const [tab, setTabState] = useState<(typeof TABS)[number]>(readTab);
  const setTab = (next: (typeof TABS)[number]) => {
    setTabState(next);
    try {
      window.localStorage.setItem(TAB_KEY, next);
    } catch {
      // Storage blocked: the tab still switches.
    }
  };
  const { colors, typography, radius, spacing, elevation } = tokens;

  const chips: { label: string; swatch?: string }[] = [
    { label: colors.brand[600], swatch: colors.brand[600] },
    { label: typography.heading.name },
    { label: `Radius ${radius.md}px` },
    { label: `${spacing.base}px grid, ${spacing.density}` },
    { label: `Shadows ${elevation.style}` },
  ];

  return (
    <section aria-label="Live preview" className="tool-tile flex min-w-0 flex-col overflow-hidden" style={{ height: 648 }}>
      <div role="tablist" aria-label="Preview pages" className="tool-tabs flex gap-1 overflow-x-auto border-b border-[var(--card-border)] px-3 pt-2">
        {TABS.map((name) => (
          <button
            key={name}
            role="tab"
            type="button"
            aria-selected={name === tab}
            onClick={() => setTab(name)}
            className={cn(
              "-mb-px h-10 shrink-0 rounded-t-[10px] border-b-2 px-3 text-sm font-medium leading-5",
              name === tab ? "border-[var(--t-brand-600)] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {name}
          </button>
        ))}
        <span className="ml-auto flex shrink-0 items-center self-center rounded-full bg-muted px-2.5 py-0.5 text-xs leading-4 text-muted-foreground">Sample content</span>
      </div>

      <div className="relative min-h-0 flex-1 p-3">
        {/* The frame. The page inside is a normal desktop page, shown at 65% scale. Light only. */}
        <div role="tabpanel" className="tool-scroll h-full overflow-y-auto overflow-x-hidden rounded-[var(--t-radius-md)] border border-border" style={{ ...previewVars(tokens), background: "var(--pv-background)" }}>
          {tab === "Pricing" || tab === "Buttons and states" || tab === "Forms" || tab === "Tables" ? (
            <ScaledStage scale={SCALE}>
              {tab === "Pricing" ? (
                <PricingPreview />
              ) : (
                <SkillScope>{tab === "Buttons and states" ? <ButtonsTab /> : tab === "Forms" ? <FormsTab /> : <TablesTab />}</SkillScope>
              )}
            </ScaledStage>
          ) : (
            <div className="flex h-full items-center justify-center bg-background text-sm text-muted-foreground">Coming next</div>
          )}
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-1.5 border-t border-[var(--card-border)] px-3 py-2.5" aria-label="Design tokens in use">
        {chips.map((chip) => (
          <span key={chip.label} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs leading-4 text-muted-foreground">
            {chip.swatch ? <span aria-hidden className="size-3 rounded-full" style={{ background: chip.swatch }} /> : null}
            {chip.label}
          </span>
        ))}
      </footer>
    </section>
  );
}
