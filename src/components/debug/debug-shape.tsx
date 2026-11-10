"use client";

import { useDesignSystem } from "@/lib/design-system";
import { Section } from "./section";

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
            <div className="font-mono text-xs text-muted-foreground">{radius[name]}px</div>
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

  return (
    <Section title="Borders" description={`${borders.width}px wide. Subtle, default and strong colors from the neutral scale.`}>
      <div className="flex flex-wrap gap-4">
        {(["colorSubtle", "color", "colorStrong"] as const).map((name) => (
          <div key={name} className="space-y-2">
            <div
              className="h-16 w-32 rounded-lg"
              style={{ border: `${borders.width}px solid ${borders[name]}`, background: colors.roles.background }}
            />
            <div className="text-xs font-medium">{name}</div>
            <div className="font-mono text-xs text-muted-foreground">{borders[name]}</div>
          </div>
        ))}
      </div>
    </Section>
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
      <div className="rounded-xl p-8" style={{ background: colors.roles.surface }}>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {elevation.shadows.map((shadow) => (
            <div
              key={shadow.level}
              className="flex h-20 items-center justify-center text-sm font-medium"
              style={{
                background: colors.roles.background,
                borderRadius: radius.md,
                boxShadow: shadow.css,
                color: colors.roles.text,
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
