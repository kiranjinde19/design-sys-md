"use client";

import { Info, TriangleAlert } from "lucide-react";
import { CODEX_LIMIT_BYTES, kib, sizeState } from "@/lib/design-system";

/**
 * The size of AGENTS.md against the 32 KiB Codex reads by default. Neutral below 30 KiB, a gentle note from 30 KiB, a
 * strong warning above 32 KiB. Status colors always come with an icon and words, never color alone.
 */
export function SizeMeter({ bytes }: { bytes: number }) {
  const state = sizeState(bytes);
  const percent = Math.min(100, (bytes / CODEX_LIMIT_BYTES) * 100);
  return (
    <div className="flex flex-col gap-2" data-size-state={state}>
      <div className="flex justify-between gap-2 text-sm leading-5">
        <span className="font-medium">AGENTS.md size for Codex</span>
        <span className="text-muted-foreground tabular-nums">{kib(bytes)} of 32 KiB</span>
      </div>
      <div
        role="meter"
        aria-label="AGENTS.md size"
        aria-valuemin={0}
        aria-valuemax={32}
        aria-valuenow={Number((bytes / 1024).toFixed(1))}
        aria-valuetext={`${kib(bytes)} of 32 KiB`}
        className="block h-2 rounded-full bg-secondary"
      >
        <span
          className="block h-2 rounded-full"
          style={{ width: `${percent}%`, background: state === "over" ? "var(--t-error-700)" : state === "near" ? "var(--t-warning-700)" : "var(--primary)" }}
        />
      </div>
      {state === "fits" ? (
        <p className="text-sm leading-5 text-muted-foreground">It fits. Above 30 KiB we show a note, and above 32 KiB Codex would cut the file.</p>
      ) : state === "near" ? (
        <p className="flex items-start gap-2 rounded-[10px] bg-[var(--t-warning-50)] p-3 text-sm font-medium leading-5 text-[var(--t-warning-700)]">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>Close to the limit. It fits in the 32 KiB Codex reads by default, but if you add more options or a longer description, check this number again.</span>
        </p>
      ) : (
        <p role="alert" className="flex items-start gap-2 rounded-[10px] bg-[var(--t-error-50)] p-3 text-sm font-medium leading-5 text-[var(--t-error-700)]">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            Over the limit. Codex would cut this file off at 32 KiB. Raise <code className="font-mono">project_doc_max_bytes</code> in ~/.codex/config.toml, or remove the secondary color and unused options.
          </span>
        </p>
      )}
      <p className="text-sm leading-5 text-muted-foreground">The file ends with a small data block, so you can import it again later.</p>
    </div>
  );
}
