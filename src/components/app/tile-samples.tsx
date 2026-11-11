"use client";

/**
 * The small live samples inside each board tile. They are drawn from the user's current design
 * system (so they change as the user edits), using the real token values. Content is top aligned
 * with 8px gaps, and every sample has a small caption.
 */

import type { CSSProperties, ReactNode } from "react";
import { VOICE_AXES, voiceLevelLabel, useDesignSystem, type SystemId } from "@/lib/design-system";
import { asStyle } from "@/components/preview/preview-stage";

const Caption = ({ children }: { children: ReactNode }) => <div className="truncate text-xs leading-4 text-muted-foreground">{children}</div>;
const Stack = ({ children }: { children: ReactNode }) => (
  <div aria-hidden className="flex flex-col gap-2">
    {children}
  </div>
);

function Swatches({ scale, height, mark }: { scale: Record<number, string>; height: number; mark?: number }) {
  return (
    <div className="flex gap-0.5">
      {Object.entries(scale).map(([step, hex]) => (
        <div
          key={step}
          title={`${step}`}
          style={{
            flex: 1,
            height,
            background: hex,
            borderRadius: 4,
            border: "1px solid var(--border)",
            // Step 600 is the exact brand color. A dark outline marks it.
            ...(mark !== undefined && Number(step) === mark ? { outline: "2px solid var(--foreground)", outlineOffset: -2 } : {}),
          }}
        />
      ))}
    </div>
  );
}

function ColorsSample() {
  const { tokens } = useDesignSystem();
  const { brand, neutral, semantic, contrastPairs } = tokens.colors;
  const failing = contrastPairs.filter((pair) => pair.kind === "text" && !pair.passes).length;
  return (
    <Stack>
      <div className="flex flex-col gap-1">
        <Swatches scale={brand} height={32} mark={600} />
        <Caption>Brand, step 600 is {brand[600]}</Caption>
      </div>
      <div className="flex flex-col gap-1">
        <Swatches scale={neutral} height={28} />
        <Caption>Neutral, {tokens.colors.neutral[500]} at the middle</Caption>
      </div>
      <div className="flex justify-between">
        {(["success", "warning", "error", "info"] as const).map((name) => (
          <span key={name} className="flex items-center gap-1.5 text-xs leading-4 text-muted-foreground">
            <span style={{ width: 8, height: 8, borderRadius: 4, background: semantic[name][600] }} />
            {name[0].toUpperCase() + name.slice(1)}
          </span>
        ))}
      </div>
      <span
        className="inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium leading-4"
        style={{ background: failing ? "var(--t-warning-50)" : "var(--t-success-50)", color: failing ? "var(--t-warning-700)" : "var(--t-success-700)", border: "1px solid color-mix(in srgb, currentColor 25%, transparent)" }}
      >
        {failing ? `${failing} text pair${failing === 1 ? "" : "s"} below AA` : "All text pairs pass AA"}
      </span>
    </Stack>
  );
}

function TypographySample() {
  const { tokens } = useDesignSystem();
  const { heading, body, baseSize, scaleRatio, headingWeight, headingTracking, sizes } = tokens.typography;
  const size = (name: string) => sizes.find((s) => s.name === name)!;
  const rows: { label: string; font: string; weight: number; px: number }[] = [
    { label: "Title", font: heading.previewStack, weight: headingWeight, px: size("lg").px },
    { label: "Body", font: body.previewStack, weight: tokens.typography.bodyWeight, px: size("base").px },
    { label: "Caption", font: body.previewStack, weight: tokens.typography.bodyWeight, px: size("xs").px },
  ];
  return (
    <Stack>
      <div style={{ fontFamily: heading.previewStack, fontWeight: headingWeight, fontSize: 56, lineHeight: "56px", letterSpacing: `${headingTracking}em` }}>Aa</div>
      <div>
        <div className="truncate text-sm font-medium leading-5">
          {heading.name} + {body.name}
        </div>
        <Caption>
          Scale {scaleRatio}, base {baseSize}px
        </Caption>
      </div>
      <div className="flex flex-col">
        {rows.map((row) => (
          <div key={row.label} className="truncate" style={{ fontFamily: row.font, fontWeight: row.weight, fontSize: row.px, lineHeight: `${Math.max(row.px + 4, 16)}px` }}>
            {row.label}
          </div>
        ))}
      </div>
    </Stack>
  );
}

function RadiusSample() {
  const { tokens } = useDesignSystem();
  const { radius, colors } = tokens;
  return (
    <Stack>
      <div className="flex gap-2">
        {([radius.sm, radius.md, radius.lg, radius.full] as const).map((r, index) => (
          <div key={index} style={{ width: 28, height: 28, background: colors.brand[100], border: `2px solid ${colors.brand[600]}`, borderRadius: Math.min(r, 14) }} />
        ))}
      </div>
      <Caption>
        {radius.sm}, {radius.md}, {radius.lg}px, full
      </Caption>
    </Stack>
  );
}

function SpacingSample() {
  const { tokens } = useDesignSystem();
  const { spacing, colors } = tokens;
  const steps = spacing.scale.filter((step) => [4, 8, 16, 24, 32].includes(step.px));
  return (
    <Stack>
      <div className="flex items-end gap-1.5" style={{ height: 32 }}>
        {steps.map((step) => (
          <div key={step.key} style={{ width: step.px, height: step.px, background: colors.brand[400], borderRadius: 2 }} />
        ))}
      </div>
      <Caption>
        {spacing.base}px grid, {spacing.density}
      </Caption>
    </Stack>
  );
}

function BordersSample() {
  const { tokens } = useDesignSystem();
  const { borders } = tokens;
  // Subtle, default and the input border: each shown as a solid chip and as a line at the real width.
  const rows: [string, string][] = [
    ["subtle", borders.colorSubtle],
    ["default", borders.color],
    ["input", borders.input],
  ];
  return (
    <Stack>
      <div className="flex flex-col gap-1">
        {rows.map(([name, color]) => (
          <div key={name} className="flex items-center gap-2" title={`${name} ${color}`}>
            <span style={{ width: 20, height: 12, borderRadius: 3, background: color, border: "1px solid var(--border)" }} />
            <span style={{ flex: 1, height: borders.width, background: color }} />
          </div>
        ))}
      </div>
      <Caption>{borders.width}px, subtle, default, input</Caption>
    </Stack>
  );
}

function ShadowsSample() {
  const { tokens } = useDesignSystem();
  const { shadows, levels, style } = tokens.elevation;
  const all = shadows.slice(1);
  return (
    <div aria-hidden className="flex flex-col gap-2">
      <div className="flex gap-2 px-0.5 pt-0.5">
        {all.length ? (
          all.map((shadow) => <div key={shadow.level} style={{ width: 20, height: 20, borderRadius: 6, background: tokens.colors.roles.background, boxShadow: shadow.css }} />)
        ) : (
          <div style={{ width: 20, height: 20, borderRadius: 6, background: tokens.colors.roles.background, border: "1px solid var(--border)" }} />
        )}
      </div>
      <Caption>
        {levels} levels, {style}
      </Caption>
    </div>
  );
}

function ButtonsSample() {
  const { tokens } = useDesignSystem();
  const { buttons, inputs } = tokens.controls;
  const style = (name: "primary" | "secondary" | "tertiary"): CSSProperties => ({
    height: 32,
    padding: "0 12px",
    borderRadius: buttons.radius,
    background: buttons.variants[name].default.background,
    color: buttons.variants[name].default.color,
    border: `${buttons.borderWidth}px solid ${buttons.variants[name].default.borderColor}`,
    fontWeight: buttons.fontWeight,
    fontSize: 14,
    lineHeight: "20px",
    fontFamily: tokens.typography.body.previewStack,
    display: "inline-flex",
    alignItems: "center",
  });
  return (
    <Stack>
      <div className="flex items-center gap-1.5">
        {(["primary", "secondary", "tertiary"] as const).map((name) => (
          <span key={name} style={style(name)}>
            {name === "primary" ? "Save" : name === "secondary" ? "Cancel" : "Skip"}
          </span>
        ))}
        <span
          style={{
            flex: 1,
            height: 32,
            minWidth: 0,
            borderRadius: 10,
            border: `${inputs.borderWidth}px solid ${inputs.states.default.borderColor}`,
            background: inputs.states.default.background,
            color: inputs.placeholderColor,
            fontSize: 14,
            lineHeight: "20px",
            padding: "0 10px",
            display: "flex",
            alignItems: "center",
            fontFamily: tokens.typography.body.previewStack,
          }}
        >
          Email
        </span>
      </div>
      <Caption>
        Height {buttons.height.md}px, radius {buttons.radius}px, secondary {tokens.controls.secondaryStyle}
      </Caption>
    </Stack>
  );
}

function SignatureSample() {
  const { tokens } = useDesignSystem();
  const { signature, colors, controls } = tokens;
  const cta = signature.primaryCta;
  const box: CSSProperties = { height: 32, flexShrink: 0 };
  return (
    <Stack>
      {/* One row, 8px gaps, left aligned, using the chosen options. The border beam itself is only shown in the preview. */}
      <div className="flex items-center gap-2 rounded-[10px] p-2" style={{ background: colors.roles.background, border: "1px solid var(--card-border)", width: "fit-content", maxWidth: "100%" }}>
        <div style={{ ...box, width: 56, ...asStyle(signature.cardStyle.css), ...asStyle(signature.featuredHighlight.css), borderRadius: 10, padding: 0 }} />
        <div style={{ ...box, width: 56, ...asStyle(signature.cardStyle.css), borderRadius: 10, padding: 0 }} />
        <div style={{ ...box, ...asStyle(signature.iconContainer.css), width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>★</div>
        <span
          style={{
            ...box,
            display: "inline-flex",
            alignItems: "center",
            padding: "0 12px",
            borderRadius: 10,
            fontSize: 12,
            lineHeight: "16px",
            fontWeight: controls.buttons.fontWeight,
            fontFamily: tokens.typography.body.previewStack,
            background: controls.buttons.variants.primary.default.background,
            color: controls.buttons.variants.primary.default.color,
            // The beam is drawn as a static 2px inset ring here.
            ...(cta.className ? { boxShadow: `inset 0 0 0 2px ${colors.brand[400]}` } : asStyle(cta.css)),
          }}
        >
          Get started
        </span>
        <div style={{ ...box, width: 48, borderRadius: 10, background: colors.roles.background, border: `1px solid ${colors.roles.border}`, ...asStyle(signature.focusRing.css) }} />
      </div>
      <Caption>
        {signature.featuredHighlight.label}, {signature.primaryCta.label}, {signature.hover.label}
      </Caption>
    </Stack>
  );
}

function VoiceSample() {
  const { settings } = useDesignSystem();
  return (
    <div aria-hidden className="flex flex-col gap-1">
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
