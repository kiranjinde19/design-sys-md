"use client";

import { Check } from "lucide-react";
import { SYSTEMS, useDesignSystem, type SystemId } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { TileSample } from "./tile-samples";

/** How many columns and rows each tile covers on the 3 column board. */
const SPAN: Record<SystemId, string> = {
  colors: "col-span-2 row-span-2",
  typography: "row-span-2",
  radius: "",
  spacing: "",
  borders: "",
  shadows: "",
  buttons: "col-span-2",
  signature: "col-span-2",
  voice: "",
};

/** The tiles whose samples sit on an inset panel are tighter, so the panel and its caption fit the 120px row. */
const COMPACT = new Set<SystemId>(["signature", "shadows", "buttons"]);

function Tile({ id, index, label, done, onOpen }: { id: SystemId; index: number; label: string; done: boolean; onOpen: (id: SystemId) => void }) {
  const compact = COMPACT.has(id);
  const content = (
    <>
      <span className={cn("flex items-center gap-2", compact ? "min-h-5" : "min-h-6")}>
        <span className="tool-num" aria-hidden>
          {index + 1}
        </span>
        <span className="min-w-0 truncate text-sm font-medium leading-5">{label}</span>
        {done ? <Check aria-hidden className="ml-auto size-4 shrink-0 text-foreground" strokeWidth={1.5} /> : null}
      </span>
      <span className="block min-h-0 flex-1">
        <TileSample id={id} />
      </span>
    </>
  );
  const common = cn("tool-tile tool-hover min-h-0 overflow-hidden p-4 text-left", SPAN[id]);
  const aria = `${label}${done ? ", reviewed" : ""}. Open the editor.`;
  // The Colors tile holds focusable swatches, so it can not be one button: a stretched button sits behind its content.
  if (id === "colors") {
    return (
      <div className={cn(common, "relative")}>
        <button type="button" onClick={() => onOpen(id)} aria-label={aria} className="absolute inset-0 rounded-[16px]" />
        <div className="pointer-events-none relative flex flex-col items-stretch justify-start gap-2">{content}</div>
      </div>
    );
  }
  return (
    <button type="button" onClick={() => onOpen(id)} aria-label={aria} className={cn(common, "flex flex-col items-stretch justify-start", compact ? "gap-1.5" : "gap-2")}>
      {content}
    </button>
  );
}

/** The bento board: 560px wide, 3 columns, 120px rows, 12px gaps. Every tile is a real button. */
export function Board({ onOpen }: { onOpen: (id: SystemId) => void }) {
  const { reviewed } = useDesignSystem();

  return (
    <div className="grid min-w-0 flex-[0_1_560px] grid-cols-3 content-start gap-3" style={{ gridAutoRows: 120 }}>
      {SYSTEMS.map((system, index) => {
        const done = reviewed.includes(system.id);
        return (
          <Tile key={system.id} id={system.id} index={index} label={system.label} done={done} onOpen={onOpen} />
        );
      })}
    </div>
  );
}
