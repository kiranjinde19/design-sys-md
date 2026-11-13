"use client";

import { useEffect, useRef } from "react";
import { Check, ChevronRight } from "lucide-react";
import { PRESETS, SYSTEMS, sentenceCase, swatchGroups, useDesignSystem, type SystemId } from "@/lib/design-system";
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
import { BrandNotice } from "./brand-notice";
import { BrandScale } from "./brand-scale";
import { RolesDnd, useRolesDnd } from "./roles-dnd";
import { RolesSection } from "./roles-section";
import { TypographyEditor } from "@/components/typography/typography-editor";
import { VoiceEditor } from "@/components/voice/voice-editor";

/** The 10 step brand scale with its step labels (600 is the exact brand color), and the generated status colors. */
function ColorScales() {
  const { tokens } = useDesignSystem();
  const { brandReport: report } = tokens.colors;
  const status = swatchGroups(tokens).find((group) => group.id === "status")!.items;
  const dnd = useRolesDnd();
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="text-sm font-medium leading-5">Brand scale</div>
        <BrandScale labels />
        <p className="text-xs leading-4 text-muted-foreground">
          {report.mode === "adjusted" && report.whiteFails ? `Step 600 is ${report.effective}, adjusted from your ${report.typed}.` : "Step 600 is your exact brand color."}
        </p>
      </div>
      <div className="space-y-1.5">
        <div className="text-sm font-medium leading-5">Status colors</div>
        <div className="grid grid-cols-4 gap-2">
          {status.map((source) => (
            <div key={source.id} className="flex flex-col gap-1">
              <button
                type="button"
                data-display-swatch={source.id}
                className="tool-swatch tool-swatch--plain"
                style={{ background: source.hex }}
                aria-label={`${sentenceCase(source.label)}, ${source.hex}`}
                title={`Click to copy ${source.hex}`}
                onClick={() => {
                  navigator.clipboard?.writeText(source.hex).catch(() => {});
                  dnd?.announce(`Copied ${source.hex}`);
                }}
              />
              <span className="text-xs leading-4 text-muted-foreground">{sentenceCase(source.label.split(" ")[0])}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The Colors controls with the Roles section. Inside the roles provider, so removing the secondary color can offer Undo. */
function ColorsWithRoles() {
  const dnd = useRolesDnd();
  return (
    <ColorsControls
      afterBrand={
        <>
          <BrandNotice />
          <ColorScales />
        </>
      }
      after={<RolesSection />}
      onSecondaryRemoved={dnd?.noteSecondaryRemoved}
    />
  );
}

/** The controls for one system. Every one of these is shared with /debug. */
function EditorBody({ id }: { id: SystemId }) {
  switch (id) {
    case "colors":
      return (
        <RolesDnd>
          <ColorsWithRoles />
        </RolesDnd>
      );
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

  // In the stacked layout the system list is a row of chips; keep the current one in view.
  const list = useRef<HTMLElement>(null);
  useEffect(() => {
    const row = list.current;
    const current = row?.querySelector<HTMLElement>('[aria-current="true"]');
    if (row && current) row.scrollLeft = Math.max(0, current.offsetLeft - (row.clientWidth - current.offsetWidth) / 2);
  }, [openId]);

  const goNext = () => {
    markReviewed(openId);
    if (next) onOpen(next.id);
    else onClose();
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 xl:h-[810px] xl:w-auto xl:flex-[0_0_auto] xl:flex-row xl:gap-6">
      <nav ref={list} aria-label="Design systems" className="tool-tabs relative -mx-1 flex shrink-0 gap-2 overflow-x-auto px-1 py-2 xl:mx-0 xl:w-56 xl:flex-col xl:overflow-visible xl:p-0">
        {SYSTEMS.map((item, itemIndex) => {
          const done = reviewed.includes(item.id);
          return (
            <button key={item.id} type="button" aria-current={item.id === openId} onClick={() => onOpen(item.id)} className="tool-item flex shrink-0 items-center gap-2 text-left text-sm font-medium leading-5 whitespace-nowrap max-xl:min-w-max">
              <span className="tool-num" aria-hidden>
                {itemIndex + 1}
              </span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {done ? <Check aria-label="Reviewed" className="size-4 shrink-0 text-foreground" strokeWidth={1.5} /> : null}
            </button>
          );
        })}
        {isModified ? (
          <div className="flex shrink-0 flex-col gap-1 xl:mt-2">
            <span className="text-xs leading-4 text-muted-foreground">{PRESETS[presetId].name}, edited</span>
            <button type="button" onClick={reset} className="tool-link h-8 self-start rounded-[10px] px-3 text-sm leading-5">
              Reset to {PRESETS[presetId].name}
            </button>
          </div>
        ) : null}
      </nav>

      <section aria-labelledby="editor-title" className="tool-panel flex h-[min(810px,85vh)] min-h-[520px] w-full shrink-0 flex-col gap-4 p-4 max-md:h-auto max-md:min-h-0 md:p-6 xl:h-auto xl:min-h-0 xl:w-[400px]">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="editor-title" className="text-2xl font-semibold leading-8 tracking-[-0.01em]">
              {system.label}
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{system.description}</p>
          </div>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs font-medium leading-4 text-muted-foreground">
            {index + 1} of {SYSTEMS.length}
          </span>
        </header>
        <div data-role-scroll className="@container relative min-h-0 flex-1 overflow-y-auto pr-3 [scrollbar-gutter:stable] max-md:overflow-visible max-md:pr-0">
          <EditorBody id={openId} />
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-2">
          <button type="button" onClick={onClose} className="tool-link inline-flex h-10 items-center rounded-[10px] px-4 text-base leading-6 whitespace-nowrap">
            Back to board
          </button>
          <div className="flex gap-2">
            {previous ? (
              <button type="button" onClick={() => onOpen(previous.id)} className="tool-link inline-flex h-10 items-center rounded-[10px] px-4 text-base leading-6">
                Previous
              </button>
            ) : null}
            <button type="button" onClick={goNext} className="tool-btn tool-btn--secondary h-10 px-4 text-base font-medium leading-6 whitespace-nowrap">
              {next ? (
                <span>
                  Next<span className="max-md:sr-only">: {next.label}</span>
                </span>
              ) : (
                "Finish"
              )}
              <ChevronRight aria-hidden className="size-4" />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
