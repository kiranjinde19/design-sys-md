"use client";

import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRESETS, SYSTEMS, useDesignSystem, type SystemId } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import {
  BordersControls,
  ButtonControls,
  ColorsControls,
  RadiusControls,
  ShadowControls,
  SignatureControls,
  SpacingControls,
  TypeScaleControls,
} from "@/components/controls/system-controls";
import { TypographyEditor } from "@/components/typography/typography-editor";
import { VoiceEditor } from "@/components/voice/voice-editor";

/** The 10 step brand scale with its step labels (600 is the exact brand color), and the generated status colors. */
function ColorScales() {
  const { tokens } = useDesignSystem();
  const { brand, semantic } = tokens.colors;
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="text-sm font-medium text-muted-foreground">Brand scale</div>
        <div className="grid grid-cols-10 gap-0.5">
          {Object.entries(brand).map(([step, hex]) => (
            <div key={step} className="flex flex-col items-center gap-1" title={`${step} ${hex}`}>
              <div
                className="h-8 w-full rounded"
                style={{ background: hex, border: "1px solid var(--border)", ...(step === "600" ? { outline: "2px solid var(--foreground)", outlineOffset: -2 } : {}) }}
              />
              <span className={cn("text-xs leading-4", step === "600" ? "font-semibold text-foreground" : "text-muted-foreground")}>{step}</span>
            </div>
          ))}
        </div>
        <p className="text-xs leading-4 text-muted-foreground">Step 600 is your exact brand color.</p>
      </div>
      <div className="space-y-1.5">
        <div className="text-sm font-medium text-muted-foreground">Status colors</div>
        <div className="grid grid-cols-4 gap-2">
          {(["success", "warning", "error", "info"] as const).map((name) => (
            <div key={name} className="flex flex-col gap-1">
              <div className="h-8 rounded" style={{ background: semantic[name][600], border: "1px solid var(--border)" }} />
              <span className="text-xs leading-4 text-muted-foreground">{name[0].toUpperCase() + name.slice(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The controls for one system. Every one of these is shared with /debug. */
function EditorBody({ id }: { id: SystemId }) {
  switch (id) {
    case "colors":
      return <ColorsControls afterBrand={<ColorScales />} />;
    case "typography":
      return (
        <div className="space-y-6">
          <TypeScaleControls />
          <TypographyEditor />
        </div>
      );
    case "radius":
      return <RadiusControls />;
    case "spacing":
      return <SpacingControls />;
    case "borders":
      return <BordersControls />;
    case "shadows":
      return <ShadowControls />;
    case "buttons":
      return <ButtonControls />;
    case "signature":
      return <SignatureControls />;
    case "voice":
      return <VoiceEditor />;
  }
}

/** Left area in the open state: a Back to board link and the system list (224px), then the editor panel (400px). */
export function Editor({ openId, onOpen, onClose }: { openId: SystemId; onOpen: (id: SystemId) => void; onClose: () => void }) {
  const { reviewed, markReviewed, presetId, isModified, reset } = useDesignSystem();
  const index = SYSTEMS.findIndex((system) => system.id === openId);
  const system = SYSTEMS[index];
  const next = SYSTEMS[index + 1];
  const previous = SYSTEMS[index - 1];

  const goNext = () => {
    markReviewed(openId);
    if (next) onOpen(next.id);
    else onClose();
  };

  return (
    <div className="flex gap-3" style={{ height: 648 }}>
      <nav aria-label="Design systems" className="flex w-56 shrink-0 flex-col gap-2">
        <Button variant="ghost" size="lg" className="h-10 justify-start gap-2 px-2" onClick={onClose}>
          <ArrowLeft aria-hidden className="size-4" />
          Back to board
        </Button>
        {SYSTEMS.map((item, itemIndex) => {
          const done = reviewed.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              aria-current={item.id === openId}
              onClick={() => onOpen(item.id)}
              className="tool-item flex items-center gap-2 text-left text-sm"
            >
              <span className="tool-num" aria-hidden>
                {itemIndex + 1}
              </span>
              <span className={cn("min-w-0 flex-1 truncate font-medium", item.id !== openId && "text-muted-foreground")}>{item.label}</span>
              {done ? <Check aria-label="Reviewed" className="size-4 shrink-0 text-[var(--t-success-700)]" strokeWidth={2.5} /> : null}
            </button>
          );
        })}
        {isModified ? (
          <div className="mt-auto flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground">
            {PRESETS[presetId].name}, edited.
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={reset}>
              Reset
            </Button>
          </div>
        ) : null}
      </nav>

      <section aria-labelledby="editor-title" className="tool-panel flex w-[400px] shrink-0 flex-col p-6">
        <header className="flex items-start justify-between gap-3 pb-4">
          <div className="min-w-0">
            <h2 id="editor-title" className="text-2xl font-semibold leading-8">
              {system.label}
            </h2>
            <p className="text-sm leading-5 text-muted-foreground">{system.description}</p>
          </div>
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs leading-4 text-muted-foreground">
            {index + 1} of {SYSTEMS.length}
          </span>
        </header>
        <div className="@container min-h-0 flex-1 overflow-y-auto">
          <EditorBody id={openId} />
        </div>
        <footer className="flex items-center justify-between gap-2 pt-4">
          <Button variant="ghost" size="lg" className="h-10 px-3" onClick={onClose}>
            Back to board
          </Button>
          <div className="flex gap-2">
            {previous ? (
              <Button variant="ghost" size="lg" className="h-10 px-3" onClick={() => onOpen(previous.id)}>
                Previous
              </Button>
            ) : null}
            <Button variant="secondary" size="lg" className="h-10 gap-1 px-3" onClick={goNext}>
              {next ? `Next: ${next.label}` : "Finish"}
              <ChevronRight aria-hidden className="size-4" />
            </Button>
          </div>
        </footer>
      </section>
    </div>
  );
}
