"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import {
  FONT_PAIRINGS,
  getFont,
  PAIRING_MONO_SAMPLE,
  PAIRING_SAMPLE_LINE,
  matchingPairingId,
  pairingSettings,
  useDesignSystem,
  type FontPairing,
} from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { galleryFamily, useGalleryFonts } from "./hosted-fonts";

/** The full cards: a sample line in each heading and body font, the mood and the reason. Shown in the details window. */
function PairingCards({ onApply }: { onApply: () => void }) {
  useGalleryFonts();
  const { settings, tokens, update } = useDesignSystem();
  const activeId = matchingPairingId(settings.typography);
  const sizes = tokens.typography.sizes;
  // 2xl is the smallest size where heading tracking applies in full.
  const headingSize = sizes.find((size) => size.name === "2xl")!;
  const bodySize = sizes.find((size) => size.name === "sm")!;
  const monoSize = sizes.find((size) => size.name === "xs")!;

  const apply = (pairing: FontPairing) => {
    update({ typography: pairingSettings(pairing) });
    onApply();
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {FONT_PAIRINGS.map((pairing) => (
        <button
          key={pairing.id}
          type="button"
          onClick={() => apply(pairing)}
          aria-pressed={pairing.id === activeId}
          className={cn(
            "flex flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary",
            pairing.id === activeId ? "border-primary ring-2 ring-primary/30" : "border-border",
          )}
        >
          <div
            style={{
              fontFamily: galleryFamily(pairing.heading),
              fontWeight: pairing.headingWeight,
              fontSize: headingSize.px,
              lineHeight: headingSize.lineHeight,
              letterSpacing: `${getFont(pairing.heading)?.tracking ?? 0}em`,
            }}
          >
            {PAIRING_SAMPLE_LINE}
          </div>
          <p
            className="text-muted-foreground"
            style={{
              fontFamily: galleryFamily(pairing.body),
              fontWeight: pairing.bodyWeight,
              fontSize: bodySize.px,
              lineHeight: bodySize.lineHeight,
            }}
          >
            {PAIRING_SAMPLE_LINE}
          </p>
          {pairing.mono ? (
            <code
              className="self-start rounded-md bg-muted px-2 py-1"
              style={{ fontFamily: galleryFamily(pairing.mono), fontSize: monoSize.px }}
            >
              {PAIRING_MONO_SAMPLE}
            </code>
          ) : null}
          <div className="mt-auto space-y-1 border-t border-border pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{pairing.name}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{pairing.mood}</span>
              {pairing.id === activeId ? (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">In use</span>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">{pairing.reason}</p>
            <p className="text-xs text-muted-foreground">
              {pairing.heading} + {pairing.body}
              {pairing.mono ? ` + ${pairing.mono}` : ""}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

/**
 * The pairing choice in the editor: eight small buttons (the name only), one line about the pairing in use, and a
 * button that opens the full cards with their samples in a window. It stays short, so Customize is visible without scrolling.
 */
export function PairingGallery({ onApply }: { onApply: () => void }) {
  const { settings, update } = useDesignSystem();
  const activeId = matchingPairingId(settings.typography);
  const active = FONT_PAIRINGS.find((pairing) => pairing.id === activeId);
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const apply = (pairing: FontPairing) => {
    update({ typography: pairingSettings(pairing) });
    onApply();
  };
  const close = () => dialog.current?.close();

  return (
    <div className="space-y-2">
      <div role="group" aria-label="Font pairings" className="grid grid-cols-2 gap-2">
        {FONT_PAIRINGS.map((pairing) => (
          <button
            key={pairing.id}
            type="button"
            onClick={() => apply(pairing)}
            aria-pressed={pairing.id === activeId}
            title={`${pairing.mood}. ${pairing.heading} + ${pairing.body}${pairing.mono ? ` + ${pairing.mono}` : ""}`}
            className={cn(
              "min-h-11 rounded-[10px] border bg-card px-3 text-left text-sm font-medium leading-5 transition-colors hover:border-primary",
              pairing.id === activeId ? "border-2 border-primary px-[11px]" : "border-border",
            )}
          >
            {pairing.name}
          </button>
        ))}
      </div>
      <p className="text-xs leading-4 text-muted-foreground" data-pairing-note>
        {active ? `${active.name}: ${active.heading} + ${active.body}${active.mono ? ` + ${active.mono}` : ""}. ${active.reason}` : "Custom pairing. Pick the fonts yourself below."}
      </p>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          dialog.current?.showModal();
        }}
        className="tool-link -ml-3 inline-flex h-11 items-center rounded-[10px] px-3 text-sm leading-5"
      >
        See samples and details
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="pairing-dialog-title"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialog.current) close();
        }}
        className="tool-panel m-auto max-h-[88vh] w-[min(960px,calc(100vw-32px))] overflow-y-auto bg-background p-4 text-foreground backdrop:bg-black/40 md:p-6"
      >
        {open ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="pairing-dialog-title" className="text-xl font-semibold leading-7">
                  Font pairings
                </h2>
                <p className="text-sm leading-5 text-muted-foreground">Choose one to apply the whole pairing: fonts, weights, tracking and an optional mono accent.</p>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="tool-btn tool-btn--secondary inline-flex size-11 shrink-0 items-center justify-center">
                <X aria-hidden className="size-4" />
              </button>
            </div>
            <PairingCards
              onApply={() => {
                onApply();
                close();
              }}
            />
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
