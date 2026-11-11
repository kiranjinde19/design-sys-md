"use client";

/**
 * The small live samples inside each board tile. They are drawn from the user's current design
 * system (so they change as the user edits), using the token values directly.
 */

import type { CSSProperties } from "react";
import { VOICE_AXES, voiceLevelLabel, useDesignSystem, type SystemId } from "@/lib/design-system";
import { asStyle } from "@/components/preview/preview-stage";

const row: CSSProperties = { display: "flex", gap: 3 };

function Scale({ scale, height = 22 }: { scale: Record<number, string>; height?: number }) {
  return (
    <div style={row} aria-hidden>
      {Object.entries(scale).map(([step, hex]) => (
        <div key={step} style={{ flex: 1, height, background: hex, borderRadius: 4, border: "1px solid var(--border)" }} />
      ))}
    </div>
  );
}

function ColorsSample() {
  const { tokens } = useDesignSystem();
  const { brand, neutral, secondary, semantic } = tokens.colors;
  return (
    <div className="flex h-full flex-col justify-end gap-2">
      <div className="space-y-1">
        <Label>Brand</Label>
        <Scale scale={brand} height={44} />
      </div>
      <div className="space-y-1">
        <Label>Neutral</Label>
        <Scale scale={neutral} height={22} />
      </div>
      {secondary ? (
        <div className="space-y-1">
          <Label>Secondary</Label>
          <Scale scale={secondary} height={22} />
        </div>
      ) : null}
      <div style={row} aria-hidden>
        {(["success", "warning", "error", "info"] as const).map((name) => (
          <div key={name} style={{ flex: 1, height: 22, borderRadius: 11, background: semantic[name][600] }} />
        ))}
      </div>
    </div>
  );
}

function Label({ children }: { children: string }) {
  return <div className="text-xs text-muted-foreground">{children}</div>;
}

function TypographySample() {
  const { tokens } = useDesignSystem();
  const { heading, body } = tokens.typography;
  return (
    <div className="flex h-full flex-col justify-between">
      <div
        aria-hidden
        style={{ fontFamily: heading.previewStack, fontWeight: tokens.typography.headingWeight, fontSize: 56, lineHeight: 1, letterSpacing: `${tokens.typography.headingTracking}em` }}
      >
        Aa
      </div>
      <div className="space-y-1">
        <div className="truncate text-sm font-medium" style={{ fontFamily: heading.previewStack }}>
          {heading.name}
        </div>
        <div className="truncate text-xs text-muted-foreground" style={{ fontFamily: body.previewStack }}>
          {body.name} · {tokens.typography.baseSize}px
        </div>
      </div>
    </div>
  );
}

function RadiusSample() {
  const { tokens } = useDesignSystem();
  const { radius, colors } = tokens;
  return (
    <div className="flex h-full items-end gap-2" aria-hidden>
      {([radius.sm, radius.md, radius.lg, radius.full] as const).map((r, index) => (
        <div
          key={index}
          style={{ width: 30, height: 30, background: colors.brand[100], border: `2px solid ${colors.brand[600]}`, borderRadius: Math.min(r, 15) }}
        />
      ))}
    </div>
  );
}

function SpacingSample() {
  const { tokens } = useDesignSystem();
  const steps = tokens.spacing.scale.filter((_, index) => index % 2 === 0).slice(0, 5);
  return (
    <div className="flex h-full flex-col justify-end gap-1" aria-hidden>
      {steps.map((step) => (
        <div key={step.key} style={{ width: Math.min(step.px * 2.4, 120), height: 8, background: tokens.colors.brand[400], borderRadius: 2 }} />
      ))}
    </div>
  );
}

function BordersSample() {
  const { tokens } = useDesignSystem();
  const { borders } = tokens;
  return (
    <div className="flex h-full flex-col justify-end gap-2" aria-hidden>
      {[borders.colorSubtle, borders.color, borders.colorStrong].map((color, index) => (
        <div key={index} style={{ height: 14, border: `${borders.width}px solid ${color}`, borderRadius: 4, background: tokens.colors.roles.background }} />
      ))}
    </div>
  );
}

function ShadowsSample() {
  const { tokens } = useDesignSystem();
  const { shadows } = tokens.elevation;
  const picks = [1, 3, 5].map((level) => shadows[Math.min(level, shadows.length - 1)]);
  return (
    <div className="flex h-full items-end gap-3 pb-1" aria-hidden>
      {picks.map((shadow, index) => (
        <div key={index} style={{ width: 30, height: 30, borderRadius: 8, background: tokens.colors.roles.background, boxShadow: shadow.css }} />
      ))}
    </div>
  );
}

function ButtonsSample() {
  const { tokens } = useDesignSystem();
  const { buttons, inputs } = tokens.controls;
  const variant = (name: "primary" | "secondary" | "tertiary") => buttons.variants[name].default;
  const style = (name: "primary" | "secondary" | "tertiary"): CSSProperties => ({
    height: 28,
    padding: "0 12px",
    borderRadius: buttons.radius,
    background: variant(name).background,
    color: variant(name).color,
    border: `${buttons.borderWidth}px solid ${variant(name).borderColor}`,
    fontWeight: buttons.fontWeight,
    fontSize: 12,
    fontFamily: tokens.typography.body.previewStack,
  });
  return (
    <div className="flex h-full flex-col justify-end gap-2" aria-hidden>
      <div style={row}>
        {(["primary", "secondary", "tertiary"] as const).map((name) => (
          <span key={name} style={{ ...style(name), display: "inline-flex", alignItems: "center" }}>
            {name === "primary" ? "Save" : name === "secondary" ? "Cancel" : "Skip"}
          </span>
        ))}
      </div>
      <div
        style={{
          height: 28,
          borderRadius: inputs.radius,
          border: `${inputs.borderWidth}px solid ${inputs.states.default.borderColor}`,
          background: inputs.states.default.background,
          color: inputs.placeholderColor,
          fontSize: 12,
          padding: "0 10px",
          display: "flex",
          alignItems: "center",
          fontFamily: tokens.typography.body.previewStack,
        }}
      >
        Email address
      </div>
    </div>
  );
}

function SignatureSample() {
  const { tokens } = useDesignSystem();
  const { signature, colors } = tokens;
  return (
    <div className="flex h-full items-end gap-3" aria-hidden>
      {/* The featured highlight on a card. The border beam is only ever shown in the preview. */}
      <div style={{ flex: 1, height: 48, borderRadius: tokens.radius.lg, ...asStyle(signature.cardStyle.css), ...asStyle(signature.featuredHighlight.css) }} />
      <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", ...asStyle(signature.iconContainer.css), fontSize: 16 }}>★</div>
      <div style={{ flex: 1, alignSelf: "center" }}>
        <div style={asStyle(signature.divider.css)} />
        <div style={{ marginTop: 10, height: 6, width: "60%", background: colors.brand[200], borderRadius: 3 }} />
      </div>
    </div>
  );
}

function VoiceSample() {
  const { settings } = useDesignSystem();
  return (
    <div className="flex h-full flex-col justify-end gap-1" aria-hidden>
      {VOICE_AXES.map((axis) => {
        const value = settings.voice[axis.key];
        return (
          <div key={axis.key} className="flex items-center gap-2">
            <div className="relative h-1.5 flex-1 rounded-full bg-border">
              <div className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-primary" style={{ left: `calc(${((value - 1) / 4) * 100}% - 6px)` }} />
            </div>
            <span className="w-24 truncate text-xs leading-4 text-muted-foreground">{voiceLevelLabel(axis.key, value)}</span>
          </div>
        );
      })}
    </div>
  );
}

const SAMPLES: Record<SystemId, () => React.JSX.Element> = {
  colors: ColorsSample,
  typography: TypographySample,
  radius: RadiusSample,
  spacing: SpacingSample,
  borders: BordersSample,
  shadows: ShadowsSample,
  buttons: ButtonsSample,
  signature: SignatureSample,
  voice: VoiceSample,
};

export function TileSample({ id }: { id: SystemId }) {
  const Sample = SAMPLES[id];
  return <Sample />;
}
