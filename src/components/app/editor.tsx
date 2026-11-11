"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SYSTEMS, useDesignSystem, type SystemId } from "@/lib/design-system";
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

/** The controls for one system. Every one of these is shared with /debug. */
function EditorBody({ id }: { id: SystemId }) {
  switch (id) {
    case "colors":
      return <ColorsControls />;
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

/** Left area in the open state: the system list (224px) and the editor panel (400px). */
export function Editor({ openId, onOpen, onClose }: { openId: SystemId; onOpen: (id: SystemId) => void; onClose: () => void }) {
  const { reviewed, markReviewed } = useDesignSystem();
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
      <nav aria-label="Design systems" className="flex w-56 shrink-0 flex-col gap-1">
        {SYSTEMS.map((item) => {
          const done = reviewed.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              aria-current={item.id === openId}
              onClick={() => onOpen(item.id)}
              className={cn("tool-item flex h-10 items-center justify-between gap-2 px-3 text-left text-sm", item.id === openId ? "font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
            >
              <span className="truncate">{item.label}</span>
              {done ? (
                <span aria-label="Reviewed" className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check aria-hidden className="size-2.5" strokeWidth={3} />
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <section aria-labelledby="editor-title" className="tool-tile flex w-[400px] shrink-0 flex-col" style={{ transition: "none" }}>
        <header className="space-y-1 border-b border-[var(--card-border)] p-4">
          <h2 id="editor-title" className="text-base font-semibold">
            {system.label}
          </h2>
          <p className="text-sm text-muted-foreground">{system.description}</p>
        </header>
        <div className="@container min-h-0 flex-1 overflow-y-auto p-4">
          <EditorBody id={openId} />
        </div>
        <footer className="flex items-center justify-between gap-2 border-t border-[var(--card-border)] p-3">
          <Button variant="ghost" size="lg" className="h-9 px-3" onClick={onClose}>
            Back to board
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="lg" className="h-9 px-3" disabled={!previous} onClick={() => previous && onOpen(previous.id)}>
              Back
            </Button>
            <Button variant="secondary" size="lg" className="h-9 px-3" onClick={goNext}>
              {next ? `Next: ${next.label}` : "Finish"}
            </Button>
          </div>
        </footer>
      </section>
    </div>
  );
}
