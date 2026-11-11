"use client";

/**
 * The small live samples inside each board tile. They are drawn from the user's current design
 * system (so they change as the user edits), using the real token values. Content is top aligned
 * with 8px gaps, and every sample has a small caption.
 */

import type { CSSProperties, ReactNode } from "react";
import { Check } from "lucide-react";
import { BrandScale } from "./brand-scale";
import { VOICE_AXES, voiceLevelLabel, useDesignSystem, type SystemId } from "@/lib/design-system";
import { asStyle } from "@/components/preview/preview-stage";

const Caption = ({ children }: { children: ReactNode }) => <div className="truncate text-xs leading-4 text-muted-foreground">{children}</div>;
const Stack = ({ children }: { children: ReactNode }) => (
  <div aria-hidden className="flex flex-col gap-2">
    {children}
  </div>
);

function Swatches({ scale }: { scale: Record<number, string> }) {
  return (
    <div aria-hidden className="flex gap-1">
      {Object.entries(scale).map(([step, hex]) => (
        <div key={step} title={step} className="tool-sample" style={{ flex: 1, height: 32, background: hex, borderRadius: 5 }} />
      ))}
    </div>
  );
}

function ColorsSample() {
  const { tokens } = useDesignSystem();
  const { brand, neutral, semantic, contrastPairs } = tokens.colors;
  const failing = contrastPairs.filter((pair) => pair.kind === "text" && !pair.passes).length;
  return (
    <div className="flex flex-col gap-2">
      <div className="pointer-events-auto flex flex-col gap-1">
        <BrandScale />
        <Caption>Brand, step 600 is {brand[600]}</Caption>
      </div>
      <div className="flex flex-col gap-1">
        <Swatches scale={neutral} />
        <Caption>Neutral, {tokens.colors.neutral[500]} at the middle</Caption>
      </div>
      <div className="flex items-center gap-3">
        {(["success", "warning", "error", "info"] as const).map((name) => (
          <span key={name} className="flex items-center gap-1 text-xs leading-4 text-muted-foreground">
            <span className="tool-sample" style={{ width: 12, height: 12, borderRadius: 9999, background: semantic[name][600] }} />
            {name[0].toUpperCase() + name.slice(1)}
          </span>
        ))}
      </div>
      <span
        className="inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium leading-4"
        style={{ background: failing ? "var(--t-warning-50)" : "var(--t-success-50)", color: failing ? "var(--t-warning-700)" : "var(--t-success-700)" }}
      >
        <Check aria-hidden width={12} height={12} strokeWidth={2} />
        {failing ? `${failing} text pair${failing === 1 ? "" : "s"} below AA` : "All text pairs pass AA"}
      </span>
    </div>
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
          <div key={index} className="tool-sample-outline" style={{ width: 32, height: 32, boxSizing: "border-box", background: colors.brand[100], border: `1px solid ${colors.brand[300]}`, borderRadius: Math.min(r, 16) }} />
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
          <div key={step.key} className="tool-sample" style={{ width: step.px, height: step.px, background: colors.brand[400], borderRadius: 2 }} />
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
            <span className="tool-sample" style={{ width: 20, height: 12, borderRadius: 3, background: color }} />
            <span style={{ flex: 1, height: borders.width, background: color }} />
          </div>
        ))}
      </div>
      <Caption>{borders.width}px, subtle, default, input</Caption>
    </Stack>
  );
}

/** An inset rounded panel (10px radius, 8px padding, the page color of the user's design, like the preview window) that holds samples. */
function Panel({ children }: { children: ReactNode }) {
  const { tokens } = useDesignSystem();
  return (
    <div aria-hidden className="tool-sample-outline flex w-fit max-w-full items-center gap-2 overflow-hidden rounded-[10px] p-2" style={{ background: tokens.colors.roles.background }}>
      {children}
    </div>
  );
}

function ShadowsSample() {
  const { tokens } = useDesignSystem();
  const { shadows, levels, style } = tokens.elevation;
  const all = shadows.slice(1);
  return (
    <div className="flex flex-col gap-1.5">
      <Panel>
        {(all.length ? all : [null]).map((shadow, index) => (
          <div key={shadow?.level ?? index} className="tool-sample-outline" style={{ width: 24, height: 24, borderRadius: 5, background: tokens.colors.roles.background, boxShadow: shadow?.css }} />
        ))}
      </Panel>
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
    height: 24,
    padding: "0 8px",
    borderRadius: Math.min(buttons.radius, 8),
    background: buttons.variants[name].default.background,
    color: buttons.variants[name].default.color,
    border: `${buttons.borderWidth}px solid ${buttons.variants[name].default.borderColor}`,
    fontWeight: buttons.fontWeight,
    fontSize: 12,
    lineHeight: "16px",
    fontFamily: tokens.typography.body.previewStack,
    display: "inline-flex",
    alignItems: "center",
  });
  return (
    <div className="flex flex-col gap-1.5">
      {/* On the same inset panel as the Signature and Shadows tiles, so a brand colored sample never disappears on a dark tile. */}
      <Panel>
        {(["primary", "secondary", "tertiary"] as const).map((name) => (
          <span key={name} className={name === "tertiary" ? undefined : "tool-sample-outline"} style={style(name)}>
            {name === "primary" ? "Save" : name === "secondary" ? "Cancel" : "Skip"}
          </span>
        ))}
        <span
          style={{
            width: 96,
            height: 24,
            boxSizing: "border-box",
            borderRadius: Math.min(buttons.radius, 8),
            border: `${inputs.borderWidth}px solid ${inputs.states.default.borderColor}`,
            background: inputs.states.default.background,
            color: inputs.placeholderColor,
            fontSize: 12,
            lineHeight: "16px",
            padding: "0 8px",
            display: "flex",
            alignItems: "center",
            fontFamily: tokens.typography.body.previewStack,
          }}
        >
          Email
        </span>
      </Panel>
      <Caption>
        Height {buttons.height.md}px, radius {buttons.radius}px, secondary {tokens.controls.secondaryStyle}
      </Caption>
    </div>
  );
}

function SignatureSample() {
  const { tokens } = useDesignSystem();
  const { signature, colors, controls } = tokens;
  const cta = signature.primaryCta;
  const box: CSSProperties = { height: 24, flexShrink: 0, boxSizing: "border-box" };
  return (
    <div className="flex flex-col gap-1.5">
      {/* The chosen options on an inset panel, each with a 1px border. The border beam itself is only shown in the preview. */}
      <Panel>
        <div className="tool-sample-outline" style={{ ...box, width: 48, ...asStyle(signature.cardStyle.css), ...asStyle(signature.featuredHighlight.css), borderRadius: 8, padding: 0 }} />
        <div className="tool-sample-outline" style={{ ...box, width: 48, ...asStyle(signature.cardStyle.css), borderRadius: 8, padding: 0 }} />
        <div className="tool-sample-outline" style={{ ...box, ...asStyle(signature.iconContainer.css), width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
          ★
        </div>
        <span
          className="tool-sample-outline"
          style={{
            ...box,
            display: "inline-flex",
            alignItems: "center",
            padding: "0 8px",
            borderRadius: 8,
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
        <div style={{ ...box, width: 40, borderRadius: 8, background: colors.roles.background, border: `1px solid ${colors.roles.input}`, ...asStyle(signature.focusRing.css) }} />
      </Panel>
      <Caption>
        {signature.featuredHighlight.label}, {signature.primaryCta.label}, {signature.hover.label}
      </Caption>
    </div>
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
            <div className="relative h-1 flex-1 rounded-full" style={{ background: "var(--t-track)" }}>
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
