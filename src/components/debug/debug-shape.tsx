"use client";

import { radiusLabel, useDesignSystem } from "@/lib/design-system";
import { PassBadge, Section } from "./section";

export function DebugRadius() {
  const { tokens } = useDesignSystem();
  const { radius, borders, colors } = tokens;

  return (
    <Section title="Radius" description="Small, medium, large and full, all generated from one number.">
      <div className="flex flex-wrap gap-6">
        {(["sm", "md", "lg", "full"] as const).map((name) => (
          <div key={name} className="space-y-2">
            <div
              className="size-20"
              style={{
                borderRadius: radius[name],
                background: colors.brand[100],
                border: `${borders.width}px solid ${colors.brand[300]}`,
              }}
            />
            <div className="text-xs font-medium">{name}</div>
            <div className="font-mono text-xs text-muted-foreground">{radiusLabel(name, radius)}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function DebugSpacing() {
  const { tokens } = useDesignSystem();
  const { spacing, colors } = tokens;

  return (
    <Section
      title="Spacing"
      description={`${spacing.base}px base grid, ${spacing.density} density. The ladder stays on the grid. Density moves the semantic values below.`}
    >
      <div className="space-y-1.5">
        {spacing.scale.map((step) => (
          <div key={step.key} className="flex items-center gap-3">
            <div className="w-24 font-mono text-xs text-muted-foreground">
              {step.key} · {step.px}px
            </div>
            <div className="h-3 rounded-sm" style={{ width: step.px, background: colors.brand[500] }} />
          </div>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {(Object.keys(spacing.semantic) as (keyof typeof spacing.semantic)[]).map((role) => (
          <div key={role} className="flex justify-between rounded-lg border border-border p-3 text-sm">
            <span>{role}</span>
            <span className="font-mono text-muted-foreground">{spacing.semantic[role]}px</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function DebugBorders() {
  const { tokens } = useDesignSystem();
  const { borders, colors } = tokens;
  const inputPair = colors.contrastPairs.find((pair) => pair.id === "input-on-background");
  const placeholderPair = colors.contrastPairs.find((pair) => pair.id === "placeholder-on-background");

  const swatch = (name: "colorSubtle" | "color" | "colorStrong" | "input") => (
    <div key={name} className="space-y-2">
      <div
        className="h-16 w-32 rounded-lg"
        style={{ border: `${borders.width}px solid ${borders[name]}`, background: colors.roles.background }}
      />
      <div className="text-xs font-medium">{name}</div>
      <div className="font-mono text-xs text-muted-foreground">{borders[name]}</div>
    </div>
  );

  return (
    <div className="space-y-10">
      <Section
        title="Borders for dividers and cards"
        description={`${borders.width}px wide. Subtle, default and strong colors from the neutral scale. These are decorative, so they have no contrast requirement.`}
      >
        <div className="flex flex-wrap gap-4">{(["colorSubtle", "color", "colorStrong"] as const).map(swatch)}</div>
      </Section>

      <Section
        title="Input border"
        description="Used for inputs, checkboxes, radios and switches. It is the lightest neutral shade that reaches 3:1 on the background. No neutral step lands exactly on 3:1, so an in-between shade is generated."
      >
        <div className="flex flex-wrap gap-4">
          {swatch("input")}
          <div className="space-y-2">
            <div
              className="flex h-16 w-32 items-center rounded-lg px-3 text-sm"
              style={{ border: `${borders.width}px solid ${borders.color}`, background: colors.roles.background, color: colors.placeholder }}
            >
              Placeholder
            </div>
            <div className="text-xs font-medium">placeholder</div>
            <div className="font-mono text-xs text-muted-foreground">{colors.placeholder}</div>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[inputPair, placeholderPair].map((pair) =>
            pair ? (
              <div key={pair.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <div className="text-sm">{pair.label}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {pair.foreground} on {pair.background} · {pair.levels.ratio.toFixed(2)}:1
                  </div>
                </div>
                <PassBadge passes={pair.passes} required={pair.required} />
              </div>
            ) : null,
          )}
        </div>
      </Section>
    </div>
  );
}

export function DebugShadows() {
  const { tokens } = useDesignSystem();
  const { radius, elevation, colors } = tokens;

  return (
    <Section
      title="Shadows"
      description={`${elevation.levels} levels, ${elevation.style} style, intensity ${elevation.intensity}.`}
    >
      {/* Generous padding and row gaps so even the largest shadow stays inside the panel. */}
      <div className="rounded-xl px-10 pb-28 pt-10" style={{ background: colors.roles.muted }}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-24 sm:grid-cols-3">
          {elevation.shadows.map((shadow) => (
            <div
              key={shadow.level}
              className="flex h-20 items-center justify-center text-sm font-medium"
              style={{
                background: colors.roles.background,
                borderRadius: radius.md,
                boxShadow: shadow.css,
                color: colors.roles.foreground,
              }}
            >
              Level {shadow.level}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
