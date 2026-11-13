"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  catalogFont,
  defaultTracking,
  effectiveFont,
  nearestWeight,
  offeredWeights,
  recommendBodyFonts,
  useDesignSystem,
} from "@/lib/design-system";
import { Section } from "@/components/controls/section";
import { nameFamily } from "./google-fonts";
import { FontPicker } from "./font-picker";
import { PairingGallery } from "./pairing-gallery";

/** Pairing gallery on top, the customize panel below. */
export function TypographyEditor() {
  const { settings, tokens, update } = useDesignSystem();
  const { typography } = settings;
  const [headingPicked, setHeadingPicked] = useState(false);
  const warnings = tokens.typography.warnings;
  const warning = tokens.colors.semantic.warning;

  const headingName = effectiveFont(typography.headingFont).name;
  const fontDefaultTracking = defaultTracking(typography.headingFont);
  const recommendations = headingPicked ? recommendBodyFonts(headingName) : [];

  return (
    <div className="space-y-10">
      <Section
        title="Font pairings"
        description="Eight starting points. One click applies the whole pairing: fonts, weights, tracking and an optional mono accent."
      >
        <PairingGallery onApply={() => setHeadingPicked(false)} />
      </Section>

      <Section
        title="Customize"
        description="Pick each font yourself. Weights are limited to what each font really offers."
      >
        <div className="grid gap-4 @4xl:grid-cols-3">
          <FontPicker
            title="Heading font"
            choice={typography.headingFont}
            initialCategory="all"
            weight={typography.headingWeight}
            onChange={(headingFont) => {
              // A chosen font starts at weight 600, or the closest weight it offers, and with its own
              // default tracking. The weight buttons and the slider can still override both.
              update({
                typography: {
                  headingFont,
                  headingWeight: nearestWeight(600, offeredWeights(headingFont)),
                  headingTracking: defaultTracking(headingFont),
                },
              });
              setHeadingPicked(true);
            }}
            onWeightChange={(headingWeight) => update({ typography: { headingWeight } })}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
                <span>Heading tracking: {typography.headingTracking}em</span>
                {typography.headingTracking !== fontDefaultTracking ? (
                  <button
                    type="button"
                    className="underline underline-offset-2 hover:text-foreground"
                    onClick={() => update({ typography: { headingTracking: fontDefaultTracking } })}
                  >
                    Reset to {fontDefaultTracking}em
                  </button>
                ) : (
                  <span className="font-normal">default for {headingName}</span>
                )}
              </div>
              <input
                type="range"
                className="w-full accent-primary"
                min={-0.04}
                max={0.02}
                step={0.005}
                value={typography.headingTracking}
                aria-label="Heading tracking"
                onChange={(event) => update({ typography: { headingTracking: Number(event.target.value) } })}
              />
            </div>
          </FontPicker>

          <FontPicker
            title="Body font"
            choice={typography.bodyFont}
            initialCategory="all"
            markDisplay
            weight={typography.bodyWeight}
            onChange={(bodyFont) => update({ typography: { bodyFont } })}
            onWeightChange={(bodyWeight) => update({ typography: { bodyWeight } })}
          >
            {warnings.length > 0 ? (
              <div
                role="alert"
                className="space-y-1 rounded-lg p-3 text-xs"
                style={{ background: warning[100], color: warning[800] }}
              >
                {warnings.map((text) => (
                  <p key={text}>{text}</p>
                ))}
              </div>
            ) : null}
          </FontPicker>

          {typography.monoFont ? (
            <FontPicker
              title="Mono font"
              choice={typography.monoFont}
              initialCategory="mono"
              onChange={(monoFont) => update({ typography: { monoFont } })}
            >
              <Button variant="ghost" size="sm" onClick={() => update({ typography: { monoFont: null } })}>
                Remove mono font
              </Button>
            </FontPicker>
          ) : (
            <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
              <h3 className="text-sm font-semibold">Mono font (optional)</h3>
              <p className="text-xs text-muted-foreground">
                For code, IDs and numbers. Most products do fine without one.
              </p>
              <Button variant="outline" size="sm" onClick={() => update({ typography: { monoFont: catalogFont("Geist Mono") } })}>
                Add a mono font
              </Button>
            </div>
          )}
        </div>

        {recommendations.length > 0 ? (
          <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
            <div>
              <h3 className="text-sm font-semibold">Body fonts that go well with {headingName}</h3>
              <p className="text-xs text-muted-foreground">
                Picked by simple rules: a serif heading gets a neutral sans, an expressive heading gets a workhorse sans, and the same family is the safe option.
              </p>
            </div>
            <div className="grid gap-2 @lg:grid-cols-3">
              {recommendations.map(({ font, reason }) => (
                <button
                  key={font.name}
                  type="button"
                  onClick={() => update({ typography: { bodyFont: catalogFont(font.name) } })}
                  className="rounded-lg border border-border bg-card p-3 text-left hover:border-primary"
                >
                  <div className="text-base" style={{ fontFamily: nameFamily(font.name) }}>
                    {font.name}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{reason}</div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </Section>
    </div>
  );
}
