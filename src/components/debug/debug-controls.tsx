"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PRESETS,
  PRESET_IDS,
  normalizeHex,
  useDesignSystem,
  type Density,
  type ElevationStyle,
  type NeutralTone,
} from "@/lib/design-system";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={`${label}: ${value}`}>
      <input
        type="range"
        className="w-full accent-primary"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </Field>
  );
}

function Choice<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={option === value ? "default" : "outline"}
            onClick={() => onChange(option)}
          >
            {option}
          </Button>
        ))}
      </div>
    </Field>
  );
}

function BrandColorInput() {
  const { settings, update } = useDesignSystem();
  const brand = settings.colors.brand;
  // While typing, show exactly what was typed. Only valid hex codes are applied.
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <Field label="Brand color">
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label="Pick brand color"
          className="h-9 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
          value={brand.toLowerCase()}
          onChange={(event) => update({ colors: { brand: event.target.value } })}
        />
        <input
          type="text"
          aria-label="Brand color hex code"
          className="h-9 w-32 rounded-md border border-border bg-background px-3 font-mono text-sm"
          value={draft ?? brand}
          onChange={(event) => {
            setDraft(event.target.value);
            const valid = normalizeHex(event.target.value);
            if (valid) update({ colors: { brand: valid } });
          }}
          onBlur={() => setDraft(null)}
          spellCheck={false}
        />
        {draft !== null && !normalizeHex(draft) ? (
          <span className="text-xs text-destructive">Use a hex code like #4F46E5</span>
        ) : null}
      </div>
    </Field>
  );
}

export function DebugControls() {
  const { presetId, isModified, settings, update, applyPreset, reset } = useDesignSystem();
  const { typography, radius, spacing, elevation, borders, controls, colors } = settings;

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {PRESET_IDS.map((id) => (
            <Button key={id} variant={id === presetId ? "default" : "outline"} onClick={() => applyPreset(id)}>
              {PRESETS[id].name}
            </Button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {PRESETS[presetId].description}
          {isModified ? " (edited)" : ""}
        </p>
        {isModified ? (
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset to {PRESETS[presetId].name}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <BrandColorInput />
        <Choice<NeutralTone>
          label="Neutral tone"
          value={colors.neutralTone}
          options={["cool", "warm", "pure", "brand"]}
          onChange={(neutralTone) => update({ colors: { neutralTone } })}
        />
        <Range label="Base size (px)" value={typography.baseSize} min={12} max={24} step={1} onChange={(baseSize) => update({ typography: { baseSize } })} />
        <Range label="Scale ratio" value={typography.scaleRatio} min={1.125} max={1.5} step={0.005} onChange={(scaleRatio) => update({ typography: { scaleRatio } })} />
        <Range label="Line height" value={typography.lineHeight} min={1.2} max={2} step={0.05} onChange={(lineHeight) => update({ typography: { lineHeight } })} />
        <Range label="Radius (px)" value={radius.base} min={0} max={24} step={1} onChange={(base) => update({ radius: { base } })} />
        <Choice<4 | 8> label="Spacing base (px)" value={spacing.base} options={[4, 8]} onChange={(base) => update({ spacing: { base } })} />
        <Choice<Density> label="Density" value={spacing.density} options={["compact", "comfortable", "spacious"]} onChange={(density) => update({ spacing: { density } })} />
        <Choice<1 | 2> label="Border width (px)" value={borders.width} options={[1, 2]} onChange={(width) => update({ borders: { width } })} />
        <Range label="Shadow levels" value={elevation.levels} min={0} max={5} step={1} onChange={(levels) => update({ elevation: { levels } })} />
        <Range label="Shadow intensity" value={elevation.intensity} min={0} max={100} step={1} onChange={(intensity) => update({ elevation: { intensity } })} />
        <Choice<ElevationStyle> label="Shadow style" value={elevation.style} options={["soft", "hard", "brand-tinted"]} onChange={(style) => update({ elevation: { style } })} />
        <Choice<"fill" | "outline"> label="Secondary button" value={controls.secondaryStyle} options={["fill", "outline"]} onChange={(secondaryStyle) => update({ controls: { secondaryStyle } })} />
      </div>
    </div>
  );
}
