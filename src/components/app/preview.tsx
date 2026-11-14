"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { ButtonsTab } from "./skill-preview/buttons-tab";
import { FormsTab } from "./skill-preview/forms-tab";
import { ScaledStage, type StageScale } from "./scaled-stage";
import { ScrollHintContext } from "./scroll-frame";
import { SkillScope } from "./skill-preview/skill-scope";
import { TablesTab } from "./skill-preview/tables-tab";
import { DashboardTab } from "./skill-preview/dashboard-tab";
import { ChartsTab } from "./skill-preview/charts-tab";
import { cn } from "@/lib/utils";
import { useDesignSystem } from "@/lib/design-system";
import { PricingPreview } from "./pricing-preview";
import { previewVars } from "./preview-vars";

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
export function Preview({ height }: { height: number }) {
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
  // The scale the stage really uses (it shrinks in a narrow frame), and whether it scrolls sideways (phones).
  const [stage, setStage] = useState<StageScale>({ scale: SCALE, scrolls: false });
  const onScale = useCallback((next: StageScale) => setStage((current) => (current.scale === next.scale && current.scrolls === next.scrolls ? current : next)), []);
  const hintId = useId();
  // Parts of the Buttons and Tables tabs that scroll sideways report here, so the hint shows whenever something does.
  const [frames, setFrames] = useState<Record<string, boolean>>({});
  const report = useCallback((id: string, scrolls: boolean) => setFrames((current) => (current[id] === scrolls || (!scrolls && !(id in current)) ? current : { ...current, [id]: scrolls })), []);
  const hintContext = useMemo(() => ({ hintId, report }), [hintId, report]);
  const frameScrolls = Object.values(frames).some(Boolean);

  const chips: { label: string; swatch?: string }[] = [
    { label: colors.brand[600], swatch: colors.brand[600] },
    { label: typography.heading.name },
    { label: `Radius ${radius.md}px` },
    { label: `${spacing.base}px grid, ${spacing.density}` },
    { label: `Shadows ${elevation.style}` },
  ];

  // Pricing, Dashboard and Charts are wide pages and are shown at 65%. The other tabs fit the frame at full size.
  const scaled = tab === "Pricing" || tab === "Dashboard" || tab === "Charts";
  const note: Record<(typeof TABS)[number], string> = {
    Pricing: "Pricing page, sample content",
    "Buttons and states": "Buttons, inputs and controls, sample content",
    Forms: "Settings form, sample content",
    Tables: "Team table, sample content",
    Dashboard: "App overview, sample content",
    Charts: "Every chart type, sample content",
  };
  const page =
    tab === "Pricing" ? (
      <PricingPreview />
    ) : (
      <SkillScope>
        {tab === "Buttons and states" ? <ButtonsTab /> : tab === "Forms" ? <FormsTab /> : tab === "Tables" ? <TablesTab /> : tab === "Dashboard" ? <DashboardTab /> : <ChartsTab />}
      </SkillScope>
    );

  return (
    <section aria-label="Live preview" className="tool-panel flex h-[560px] w-full min-w-0 flex-col overflow-hidden md:h-[640px] xl:h-[var(--preview-h)] xl:min-w-0 xl:flex-1" style={{ ["--preview-h" as string]: `${height}px` }}>
      <div role="tablist" aria-label="Preview pages" className="tool-tabs flex items-end gap-1 overflow-x-auto border-b border-border px-2 pt-2 md:px-4">
        {TABS.map((name) => (
          <button
            key={name}
            role="tab"
            type="button"
            aria-selected={name === tab}
            onClick={() => setTab(name)}
            className={cn(
              "-mb-px h-10 shrink-0 border-b-2 px-3 text-sm font-medium leading-5 whitespace-nowrap",
              name === tab ? "border-[var(--t-brand-600)] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {name}
          </button>
        ))}
        <span className="ml-auto flex shrink-0 items-center self-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium leading-4 whitespace-nowrap text-muted-foreground">Sample content</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 bg-[var(--t-surface)] p-4">
        <div className="flex flex-wrap justify-between gap-x-4 text-xs leading-4 text-muted-foreground">
          <span>{note[tab]}</span>
          <span>{scaled ? `Shown at ${Math.round(stage.scale * 100)}%` : "Changes as you edit"}</span>
          {(scaled && stage.scrolls) || frameScrolls ? (
            <span id={hintId} className="basis-full text-foreground">
              Swipe sideways to see the full preview
            </span>
          ) : null}
        </div>
        {/* The stage. Light only; it receives the user's design system and nothing else. */}
        <div role="tabpanel" className="tool-scroll relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-[10px] border border-border shadow-[var(--t-shadow-sm)]" style={{ ...previewVars(tokens), background: "var(--pv-background)" }}>
          <ScrollHintContext.Provider value={hintContext}>
            {scaled ? (
              <ScaledStage key={tab} scale={SCALE} hintId={hintId} onScale={onScale}>
                {page}
              </ScaledStage>
            ) : (
              page
            )}
          </ScrollHintContext.Provider>
        </div>
      </div>

      <footer className="flex flex-wrap gap-2 border-t border-border px-4 py-3" aria-label="Design tokens in use">
        {chips.map((chip) => (
          <span key={chip.label} className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium leading-4 text-muted-foreground">
            {chip.label}
          </span>
        ))}
      </footer>
    </section>
  );
}
