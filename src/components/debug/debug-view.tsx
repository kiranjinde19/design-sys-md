"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDesignSystem } from "@/lib/design-system";
import { DebugColors } from "./debug-colors";
import { DebugButtons } from "./debug-buttons";
import { DebugSignature } from "./debug-components";
import { DebugControls } from "./debug-controls";
import { DebugBorders, DebugRadius, DebugShadows, DebugSpacing } from "./debug-shape";
import { DebugType } from "./debug-type";
import { ExportPanel } from "@/components/export/export-panel";
import { VoiceEditor } from "@/components/voice/voice-editor";
import { TypographyEditor } from "@/components/typography/typography-editor";
import { useSelectedFonts } from "@/components/typography/google-fonts";

/** Each tab has its own link, e.g. /debug#buttons, so a section can be bookmarked or shared. */
const TAB_IDS = ["colors", "typography", "radius", "spacing", "borders", "shadows", "buttons", "signature", "voice", "export"];

function tabFromHash(): number {
  if (typeof window === "undefined") return 0;
  const index = TAB_IDS.indexOf(window.location.hash.replace("#", ""));
  return index === -1 ? 0 : index;
}

export function DebugView() {
  const { ready } = useDesignSystem();
  // Load only the fonts currently selected, so every tab previews with the real fonts.
  useSelectedFonts();
  const [active, setActiveState] = useState(tabFromHash);
  const setActive = (index: number) => {
    setActiveState(index);
    window.history.replaceState(null, "", `#${TAB_IDS[index]}`);
  };

  const tabs: { label: string; content: ReactNode }[] = [
    { label: "Colors", content: <DebugColors /> },
    {
      label: "Typography",
      content: (
        <div className="space-y-12">
          <TypographyEditor />
          <DebugType />
        </div>
      ),
    },
    { label: "Radius", content: <DebugRadius /> },
    { label: "Spacing", content: <DebugSpacing /> },
    { label: "Borders", content: <DebugBorders /> },
    { label: "Shadows", content: <DebugShadows /> },
    { label: "Buttons and inputs", content: <DebugButtons /> },
    { label: "Signature details", content: <DebugSignature /> },
    { label: "Tone of voice", content: <VoiceEditor /> },
    { label: "Export", content: <ExportPanel /> },
  ];
  const last = tabs.length - 1;

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8">
      <header className="mb-8 space-y-3">
        <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          This page is temporary. It exists only to test the token engine and will be removed before launch.
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Token engine debug</h1>
        <p className="font-mono text-xs text-muted-foreground">
          Built from commit {process.env.NEXT_PUBLIC_BUILD_COMMIT} at {process.env.NEXT_PUBLIC_BUILD_TIME}
        </p>
      </header>

      {ready ? (
        <div className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]">
          {/* Left: controls, stacked vertically. Scrolls on its own on large screens. */}
          <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto lg:pr-3">
            <DebugControls />
          </aside>

          {/* Right: output, one system per tab. Step through with Back and Next, or jump anywhere. */}
          <div className="@container min-w-0 space-y-6">
            <div role="tablist" aria-label="Design systems" className="flex gap-1 overflow-x-auto border-b border-border">
              {tabs.map((tab, index) => (
                <button
                  key={tab.label}
                  role="tab"
                  type="button"
                  aria-selected={index === active}
                  onClick={() => setActive(index)}
                  className={cn(
                    "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                    index === active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full text-xs",
                      index === active ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    {index + 1}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>

            <div role="tabpanel">{tabs[active].content}</div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button variant="outline" disabled={active === 0} onClick={() => setActive(active - 1)}>
                Back
              </Button>
              <span className="text-sm text-muted-foreground">
                Step {active + 1} of {tabs.length}
              </span>
              <Button disabled={active === last} onClick={() => setActive(active + 1)}>
                Next{active < last ? `: ${tabs[active + 1].label}` : ""}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Loading your saved work…</p>
      )}
    </main>
  );
}
