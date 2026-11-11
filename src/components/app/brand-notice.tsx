"use client";

import { Trash2 } from "lucide-react";
import { useDesignSystem } from "@/lib/design-system";
import { pickReadableText } from "@/lib/design-system/contrast";
import { cn } from "@/lib/utils";

/**
 * Shown under the brand color field. When white text on the typed color is below 4.5:1 it offers two live
 * sample buttons: keep the exact color (dark text) or adjust slightly so white text passes. The choice is saved.
 */
export function BrandNotice() {
  const { tokens, settings, update } = useDesignSystem();
  const report = tokens.colors.brandReport;
  const ink = tokens.colors.neutral[900];
  const exactText = pickReadableText(report.typed, "#FFFFFF", ink);
  const options = [
    { mode: "exact" as const, color: report.typed, text: exactText, label: "Keep my exact color, dark text" },
    { mode: "adjusted" as const, color: report.adjusted, text: "#FFFFFF", label: `Adjust slightly so white text passes: ${report.adjusted}` },
  ];
  // The first option says "dark text" only when dark text is what is used.
  options[0].label = exactText.toUpperCase() === "#FFFFFF" ? "Keep my exact color" : "Keep my exact color, dark text";

  return (
    <div className="space-y-3">
      {report.whiteFails ? (
        <div role="group" aria-label="White text on your brand color" className="space-y-2 rounded-[10px] border border-border bg-muted p-3">
          <p className="text-sm leading-5">
            White text on <span className="font-mono">{report.typed}</span> is {report.whiteOnTyped.toFixed(2)}:1, below AA.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {options.map((option) => {
              const selected = settings.colors.brandMode === option.mode;
              return (
                <button
                  key={option.mode}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => update({ colors: { brandMode: option.mode } })}
                  className={cn("flex flex-col items-start gap-2 rounded-[10px] bg-background p-2 text-left text-xs leading-4", selected ? "border-2 border-[var(--t-brand-600)] p-[7px]" : "border border-border")}
                >
                  <span className="inline-flex h-8 items-center rounded-[10px] px-3 text-sm font-medium" style={{ background: option.color, color: option.text }}>
                    Button
                  </span>
                  <span className="text-muted-foreground">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {report.textStep !== 600 ? (
        <p className="text-xs leading-4 text-muted-foreground">
          Brand colored text (links, tertiary buttons, labels) uses {report.textStep === null ? "the dark text color" : `step ${report.textStep}`}, so it stays readable.
        </p>
      ) : null}
      {report.nearError ? (
        <p className="flex items-start gap-2 text-xs leading-4 text-muted-foreground">
          <Trash2 aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          This brand is close to the error red, so destructive buttons use a tinted style (light red background, dark red text, a trash icon). Solid red is kept for confirmation dialogs.
        </p>
      ) : null}
    </div>
  );
}
