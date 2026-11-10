"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  PRESETS,
  PRESET_IDS,
  normalizeHex,
  suggestSecondaryColors,
  useDesignSystem,
  type Density,
  type ElevationStyle,
  type NeutralTone,
} from "@/lib/design-system";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-border pt-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
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

/** A color picker plus a hex box. Only valid hex codes are applied while typing. */
function HexColorField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (hex: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`Pick ${label.toLowerCase()}`}
          className="h-9 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
          value={value.toLowerCase()}
          onChange={(event) => onCommit(event.target.value)}
        />
        <input
          type="text"
          aria-label={`${label} hex code`}
          className="h-9 w-28 rounded-md border border-border bg-background px-3 font-mono text-sm"
          value={draft ?? value}
          onChange={(event) => {
            setDraft(event.target.value);
            const valid = normalizeHex(event.target.value);
            if (valid) onCommit(valid);
          }}
          onBlur={() => setDraft(null)}
          spellCheck={false}
        />
      </div>
      {draft !== null && !normalizeHex(draft) ? (
        <p className="text-xs text-destructive">Use a hex code like #4F46E5</p>
      ) : null}
    </Field>
  );
}

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
          onChange={(event) => update({ colors: { secondary: event.target.checked ? suggestions[1].hex : null } })}
        />
        Add a secondary color
      </label>

      {secondary !== null ? (
        <>
          <HexColorField label="Secondary color" value={secondary} onCommit={(hex) => update({ colors: { secondary: hex } })} />
          <Field label="Suggestions based on your brand color">
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion.label}
                  size="sm"
                  variant={suggestion.hex === secondary ? "default" : "outline"}
                  onClick={() => update({ colors: { secondary: suggestion.hex } })}
                >
                  <span
                    className="size-3 rounded-full border border-border"
                    style={{ background: suggestion.hex }}
                    aria-hidden
                  />
                  {suggestion.label}
                </Button>
              ))}
            </div>
          </Field>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          Optional. Most products do fine with one brand color plus grays.
        </p>
      )}
    </div>
  );
}

export function DebugControls() {
  const { presetId, isModified, settings, update, applyPreset, reset } = useDesignSystem();
  const { typography, radius, spacing, elevation, borders, controls, colors } = settings;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Preset</h2>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_IDS.map((id) => (
            <Button key={id} size="sm" variant={id === presetId ? "default" : "outline"} onClick={() => applyPreset(id)}>
              {PRESETS[id].name}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {PRESETS[presetId].description}
          {isModified ? " (edited)" : ""}
        </p>
        {isModified ? (
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset to {PRESETS[presetId].name}
          </Button>
        ) : null}
      </div>

      <Group title="Colors">
        <HexColorField label="Brand color" value={colors.brand} onCommit={(brand) => update({ colors: { brand } })} />
        <SecondaryColor />
        <Choice<NeutralTone>
          label="Neutral tone"
          value={colors.neutralTone}
          options={["cool", "warm", "pure", "brand"]}
          onChange={(neutralTone) => update({ colors: { neutralTone } })}
        />
      </Group>

      <Group title="Typography">
        <Range label="Base size (px)" value={typography.baseSize} min={12} max={24} step={1} onChange={(baseSize) => update({ typography: { baseSize } })} />
        <Range label="Scale ratio" value={typography.scaleRatio} min={1.125} max={1.5} step={0.005} onChange={(scaleRatio) => update({ typography: { scaleRatio } })} />
        <Range label="Line height" value={typography.lineHeight} min={1.2} max={2} step={0.05} onChange={(lineHeight) => update({ typography: { lineHeight } })} />
      </Group>

      <Group title="Radius, spacing and borders">
        <Range label="Radius (px)" value={radius.base} min={0} max={24} step={1} onChange={(base) => update({ radius: { base } })} />
        <Choice<4 | 8> label="Spacing base (px)" value={spacing.base} options={[4, 8]} onChange={(base) => update({ spacing: { base } })} />
        <Choice<Density> label="Density" value={spacing.density} options={["compact", "comfortable", "spacious"]} onChange={(density) => update({ spacing: { density } })} />
        <Choice<1 | 2> label="Border width (px)" value={borders.width} options={[1, 2]} onChange={(width) => update({ borders: { width } })} />
      </Group>

      <Group title="Shadows">
        <Range label="Levels" value={elevation.levels} min={0} max={5} step={1} onChange={(levels) => update({ elevation: { levels } })} />
        <Range label="Intensity" value={elevation.intensity} min={0} max={100} step={1} onChange={(intensity) => update({ elevation: { intensity } })} />
        <Choice<ElevationStyle> label="Style" value={elevation.style} options={["soft", "hard", "brand-tinted"]} onChange={(style) => update({ elevation: { style } })} />
      </Group>

      <Group title="Buttons">
        <Choice<"fill" | "outline"> label="Secondary button" value={controls.secondaryStyle} options={["fill", "outline"]} onChange={(secondaryStyle) => update({ controls: { secondaryStyle } })} />
      </Group>
    </div>
  );
}
