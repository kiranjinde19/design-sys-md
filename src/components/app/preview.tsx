"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useDesignSystem } from "@/lib/design-system";
import { PricingPreview } from "./pricing-preview";
import { previewVars } from "./preview-vars";
import "./preview.css";

const TABS = ["Pricing", "Buttons and states", "Forms", "Tables", "Dashboard", "Charts"] as const;

/** The live preview tile: tabs, a framed stage at 65% scale, and a footer of small token chips. */
export function Preview() {
  const { tokens } = useDesignSystem();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Pricing");
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
      <div role="tablist" aria-label="Preview pages" className="flex gap-1 overflow-x-auto border-b border-[var(--card-border)] px-3 pt-2">
        {TABS.map((name) => (
          <button
            key={name}
            role="tab"
            type="button"
            aria-selected={name === tab}
            onClick={() => setTab(name)}
            className={cn(
              "-mb-px shrink-0 rounded-t-md border-b-2 px-3 py-2 text-sm font-medium",
              name === tab ? "border-[var(--t-brand-600)] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="relative min-h-0 flex-1 p-3">
        <span className="absolute bottom-6 right-6 z-10 rounded-full bg-background/90 px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-border">
          Sample content
        </span>
        {/* The frame. The page inside is a normal desktop page, shown at 65% scale. Light only. */}
        <div role="tabpanel" className="h-full overflow-hidden rounded-[var(--t-radius-md)] border border-border" style={previewVars(tokens)}>
          {tab === "Pricing" ? (
            <div className="h-full" style={{ zoom: 0.65 }}>
              <PricingPreview />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center bg-background text-sm text-muted-foreground">Coming next</div>
          )}
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-1.5 border-t border-[var(--card-border)] px-3 py-2.5" aria-label="Design tokens in use">
        {chips.map((chip) => (
          <span key={chip.label} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
            {chip.swatch ? <span aria-hidden className="size-3 rounded-full" style={{ background: chip.swatch }} /> : null}
            {chip.label}
          </span>
        ))}
      </footer>
    </section>
  );
}
