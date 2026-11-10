"use client";

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
import { galleryFamily, useGalleryFonts } from "./google-fonts";

export function PairingGallery({ onApply }: { onApply: () => void }) {
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
    <div className="grid gap-3 sm:grid-cols-2">
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
