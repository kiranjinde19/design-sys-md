"use client";

import {
  WHITE,
  checkContrast,
  pickReadableText,
  useDesignSystem,
  SCALE_STEPS,
  type ColorScale,
} from "@/lib/design-system";
import { ContrastBadge, Section } from "./section";

function ScaleRow({ name, scale }: { name: string; scale: ColorScale }) {
  const { tokens } = useDesignSystem();
  const ink = tokens.colors.neutral[900];

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium first-letter:uppercase">{name}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-10">
        {SCALE_STEPS.map((step) => {
          const hex = scale[step];
          const onWhite = checkContrast(WHITE, hex);
          const onInk = checkContrast(ink, hex);
          return (
            <div
              key={step}
              className="rounded-lg p-2 text-xs"
              style={{ background: hex, color: pickReadableText(hex, WHITE, ink) }}
            >
              <div className="font-semibold">{step}</div>
              <div className="font-mono">{hex}</div>
              <div className="mt-2 opacity-90">White: {onWhite.label}</div>
              <div className="opacity-90">Ink: {onInk.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DebugColors() {
  const { tokens } = useDesignSystem();
  const { colors } = tokens;

  return (
    <Section
      title="Colors"
      description="Each swatch shows how white text and dark ink text would read on it. AA is the standard to aim for."
    >
      <ScaleRow name="Brand (step 600 is your exact color)" scale={colors.brand} />
      {colors.secondary ? (
        <ScaleRow name="Secondary (step 600 is your exact color)" scale={colors.secondary} />
      ) : null}
      <ScaleRow name="Neutral" scale={colors.neutral} />
      {(Object.keys(colors.semantic) as (keyof typeof colors.semantic)[]).map((name) => (
        <ScaleRow key={name} name={name} scale={colors.semantic[name]} />
      ))}

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Roles</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {(Object.keys(colors.roles) as (keyof typeof colors.roles)[]).map((role) => (
            <div key={role} className="space-y-1.5">
              <div
                className="h-12 rounded-lg border border-border"
                style={{ background: colors.roles[role] }}
              />
              <div className="text-xs font-medium">{role}</div>
              <div className="font-mono text-xs text-muted-foreground">{colors.roles[role]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Contrast checks</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {colors.contrastPairs.map((pair) => (
            <div
              key={pair.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-12 items-center justify-center rounded-md border border-border text-sm font-semibold"
                  style={{ background: pair.background, color: pair.foreground }}
                >
                  Aa
                </span>
                <span className="text-sm">{pair.label}</span>
              </div>
              <ContrastBadge result={pair.result} />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
