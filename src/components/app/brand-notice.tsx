"use client";

import { Trash2 } from "lucide-react";
import { useDesignSystem } from "@/lib/design-system";
import { contrastRatio, pickReadableText } from "@/lib/design-system/contrast";
import { hexToOklch } from "@/lib/design-system/color-math";
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
  const exactIsWhite = exactText.toUpperCase() === "#FFFFFF";
  // How far the adjusted color moved, in OKLCH lightness.
  const change = Math.abs(hexToOklch(report.typed).l - hexToOklch(report.adjusted).l);
  const size = change >= 0.12 ? "a lot" : "a little";
  // Dark text on the typed color is a clear win when it reaches AAA (7:1).
  const recommendExact = !exactIsWhite && contrastRatio(exactText, report.typed) >= 7;
  const options = [
    {
      mode: "exact" as const,
      color: report.typed,
      text: exactText,
      label: exactIsWhite ? "Keep my exact color" : "Keep my exact color, dark text",
      detail: report.typed,
      recommended: recommendExact,
    },
    {
      mode: "adjusted" as const,
      color: report.adjusted,
      text: "#FFFFFF",
      label: `Darken ${size} so white text passes`,
      detail: `${report.typed} to ${report.adjusted}`,
      recommended: false,
    },
  ];

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
                  <span className="text-muted-foreground">
                    {option.label}
                    {option.recommended ? <span className="font-medium text-foreground">{" "}(Recommended)</span> : null}
                    <span className="mt-0.5 block font-mono">{option.detail}</span>
                  </span>
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
          This brand is close to the error red, so destructive buttons use a tinted style (light red background, dark red text, a trash icon) and solid red is kept for confirmation dialogs. Focus rings use the dark text color so a focused field never looks like an error, and errors always show an icon and a message as well as color.
        </p>
      ) : null}
    </div>
  );
}
