"use client";

import { useRef, useState } from "react";
import { swatchGroups, useDesignSystem } from "@/lib/design-system";
import { DragSwatch } from "./roles-dnd";

/**
 * The 10 step brand scale as a row of focusable swatch buttons. Each has an aria-label ("Brand 50, #F4F6FF"), shows its
 * step and hex in a tooltip row above the swatches (on hover and on keyboard focus, never over other text), and copies
 * its hex when clicked. Step 600 is the user's own color: a two tone ring, aria-current and "your color" in its label.
 */
export function BrandScale({ labels = false }: { labels?: boolean }) {
  const { tokens } = useDesignSystem();
  const steps = Object.entries(tokens.colors.brand);
  const sources = swatchGroups(tokens)[0].items;
  const [active, setActive] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = (index: number, hex: string) => {
    // The confirmation shows at once; the clipboard write can be slow or blocked, and the hex is in the tooltip anyway.
    setCopied(index);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1300);
    navigator.clipboard?.writeText(hex).catch(() => {});
  };

  const shown = active ?? copied;
  const [shownStep, shownHex] = shown === null ? ["", ""] : steps[shown];

  return (
    <div className="flex flex-col">
      {/* A reserved row for the tooltip, so it never covers text. */}
      <div className="relative h-6" aria-hidden>
        {shown !== null ? (
          <span className="tool-tip" style={{ left: `clamp(56px, ${(shown + 0.5) * 10}%, calc(100% - 56px))` }}>
            {copied === shown ? "Copied" : `${shownStep} · ${shownHex}${shownStep === "600" ? " · your color" : ""}`}
          </span>
        ) : null}
      </div>
      <div className="flex gap-1">
        {steps.map(([step, hex], index) => (
          <div key={step} className="flex flex-1 flex-col items-center gap-1">
            <DragSwatch
              source={sources[index]}
              className="tool-swatch w-full"
              style={{ background: hex }}
              aria-label={`Brand ${step}, ${hex}${step === "600" ? ", your color" : ""}`}
              aria-current={step === "600" ? "true" : undefined}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              onClick={() => copy(index, hex)}
            />
            {labels ? <span className={step === "600" ? "text-xs font-semibold leading-4" : "text-xs leading-4 text-muted-foreground"}>{step}</span> : null}
          </div>
        ))}
      </div>
      <span className="sr-only" role="status">
        {copied !== null ? `Copied ${steps[copied][1]}` : ""}
      </span>
    </div>
  );
}
