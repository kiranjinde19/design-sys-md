"use client";

/**
 * One panel of controls per design system. Each panel reads and changes the design system through
 * useDesignSystem(), so /debug and the tool screen at /app share exactly the same logic.
 * (Typography and Tone of voice have their own larger editors, see components/typography and components/voice.)
 */

import type { ReactNode } from "react";
import {
  SIGNATURE_CATALOG,
  suggestSecondaryColors,
  useDesignSystem,
  type Density,
  type ElevationStyle,
  type NeutralTone,
  type SignatureSettings,
} from "@/lib/design-system";
import { Choice, ChoiceButton, Field, HexColorField, Range } from "./controls";

/** The secondary color is optional: off by default, and removed again with one click. */
function SecondaryColor() {
  const { settings, update } = useDesignSystem();
  const secondary = settings.colors.secondary;
  const suggestions = suggestSecondaryColors(settings.colors.brand);

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={secondary !== null}
          onChange={(event) => update({ colors: { secondary: event.target.checked ? suggestions[0].hex : null } })}
        />
        Add a secondary color
      </label>

      {secondary !== null ? (
        <>
          <HexColorField label="Secondary color" value={secondary} onCommit={(hex) => update({ colors: { secondary: hex } })} />
          <Field label="Suggestions based on your brand color">
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((suggestion) => (
                <ChoiceButton
                  key={suggestion.label}
                  selected={suggestion.hex === secondary}
                  onClick={() => update({ colors: { secondary: suggestion.hex } })}
                >
                  <span className="size-3 rounded-full border border-border" style={{ background: suggestion.hex }} aria-hidden />
                  {suggestion.label}
                </ChoiceButton>
              ))}
            </div>
          </Field>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">Optional. Most products do fine with one brand color plus grays.</p>
      )}
    </div>
  );
}

export function ColorsControls({ afterBrand, after }: { afterBrand?: ReactNode; after?: ReactNode }) {
  const { settings, update } = useDesignSystem();
  const { colors } = settings;
  return (
    <div className="space-y-4">
      <HexColorField label="Brand color" value={colors.brand} onCommit={(brand) => update({ colors: { brand, brandMode: "exact" } })} />
      {afterBrand}
      <SecondaryColor />
      <Choice<NeutralTone>
        label="Neutral tone"
        value={colors.neutralTone}
        options={["cool", "warm", "pure", "brand"]}
        onChange={(neutralTone) => update({ colors: { neutralTone } })}
      />
      {after}
    </div>
  );
}

/** The three scale sliders. The font pickers and pairings are in TypographyEditor. */
export function TypeScaleControls() {
  const { settings, update } = useDesignSystem();
  const { typography } = settings;
  return (
    <div className="space-y-4">
      <Range label="Base size (px)" value={typography.baseSize} min={12} max={24} step={1} onChange={(baseSize) => update({ typography: { baseSize } })} />
      <Range label="Scale ratio" value={typography.scaleRatio} min={1.125} max={1.5} step={0.005} onChange={(scaleRatio) => update({ typography: { scaleRatio } })} />
      <Range label="Line height" value={typography.lineHeight} min={1.2} max={2} step={0.05} onChange={(lineHeight) => update({ typography: { lineHeight } })} />
    </div>
  );
}

export function RadiusControls() {
  const { settings, update } = useDesignSystem();
  return <Range label="Radius (px)" value={settings.radius.base} min={0} max={24} step={1} onChange={(base) => update({ radius: { base } })} />;
}

export function SpacingControls() {
  const { settings, update } = useDesignSystem();
  return (
    <div className="space-y-4">
      <Choice<4 | 8> label="Spacing base (px)" value={settings.spacing.base} options={[4, 8]} onChange={(base) => update({ spacing: { base } })} />
      <Choice<Density> label="Density" value={settings.spacing.density} options={["compact", "comfortable", "spacious"]} onChange={(density) => update({ spacing: { density } })} />
    </div>
  );
}

export function BordersControls() {
  const { settings, update } = useDesignSystem();
  return <Choice<1 | 2> label="Border width (px)" value={settings.borders.width} options={[1, 2]} onChange={(width) => update({ borders: { width } })} />;
}

export function ShadowControls() {
  const { settings, update } = useDesignSystem();
  const { elevation } = settings;
  return (
    <div className="space-y-4">
      <Range label="Levels" value={elevation.levels} min={0} max={5} step={1} onChange={(levels) => update({ elevation: { levels } })} />
      <Range label="Intensity" value={elevation.intensity} min={0} max={100} step={1} onChange={(intensity) => update({ elevation: { intensity } })} />
      <Choice<ElevationStyle> label="Style" value={elevation.style} options={["soft", "hard", "brand-tinted"]} onChange={(style) => update({ elevation: { style } })} />
    </div>
  );
}

export function ButtonControls() {
  const { settings, update } = useDesignSystem();
  return (
    <Choice<"fill" | "outline">
      label="Secondary button"
      value={settings.controls.secondaryStyle}
      options={["fill", "outline"]}
      onChange={(secondaryStyle) => update({ controls: { secondaryStyle } })}
    />
  );
}

/** One row of options per signature category, straight from the catalog. */
export function SignatureControls() {
  const { settings, update } = useDesignSystem();
  return (
    <div className="space-y-4">
      {(Object.keys(SIGNATURE_CATALOG) as (keyof SignatureSettings)[]).map((key) => {
        const category = SIGNATURE_CATALOG[key];
        const ids = category.options.map((option) => option.id as string);
        return (
          <Choice<string>
            key={key}
            label={category.label}
            value={settings.signature[key] as string}
            options={ids}
            labelFor={(id) => category.options.find((option) => option.id === id)?.label ?? id}
            segmented={false}
            onChange={(id) => update({ signature: { [key]: id } as Partial<SignatureSettings> })}
          />
        );
      })}
    </div>
  );
}
