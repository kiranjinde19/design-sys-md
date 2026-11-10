"use client";

import {
  WHITE,
  pickReadableText,
  useDesignSystem,
  SCALE_STEPS,
  type ColorScale,
  type ContrastLevels,
  type ScaleGuidance,
  type ScaleReport,
} from "@/lib/design-system";
import { ContrastBadge, Section } from "./section";

const mark = (passes: boolean) => (passes ? "✓" : "✕");

/** "4.5 ✓  3 ✓  7 ✕": pass or fail at normal text, large text and UI, and AAA. */
function levelsText(levels: ContrastLevels) {
  return `4.5 ${mark(levels.normal)}  3 ${mark(levels.large)}  7 ${mark(levels.aaa)}`;
}

function guidanceText(guidance: ScaleGuidance) {
  const white = guidance.whiteTextFrom ? `step ${guidance.whiteTextFrom} and darker` : "no step";
  const dark = guidance.darkTextUpTo ? `step ${guidance.darkTextUpTo} and lighter` : "no step";
  return `Filled backgrounds with white text: ${white}. With dark text: ${dark}.`;
}

function ScaleRow({ name, scale, report }: { name: string; scale: ColorScale; report: ScaleReport }) {
  const { tokens } = useDesignSystem();
  const ink = tokens.colors.neutral[900];

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-sm font-medium first-letter:uppercase">{name}</h3>
        <p className="text-xs text-muted-foreground">{guidanceText(report.guidance)}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {SCALE_STEPS.map((step) => {
          const hex = scale[step];
          const { onWhite, onBlack } = report.contrast[step];
          return (
            <div
              key={step}
              className="rounded-lg p-2 text-xs"
              style={{ background: hex, color: pickReadableText(hex, WHITE, ink) }}
            >
              <div className="font-semibold">{step}</div>
              <div className="font-mono">{hex}</div>
              <div className="mt-2">
                <div>White {onWhite.ratio.toFixed(2)}:1</div>
                <div className="font-mono opacity-90">{levelsText(onWhite)}</div>
              </div>
              <div className="mt-1.5">
                <div>Black {onBlack.ratio.toFixed(2)}:1</div>
                <div className="font-mono opacity-90">{levelsText(onBlack)}</div>
              </div>
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
      description="Each swatch is checked against white and black at three levels: 4.5 is normal text (AA), 3 is large text and UI parts such as borders, icons and focus rings, and 7 is AAA. A tick means it passes."
    >
      <ScaleRow name="Brand (step 600 is your exact color)" scale={colors.brand} report={colors.reports.brand} />
      {colors.secondary && colors.reports.secondary ? (
        <ScaleRow name="Secondary (step 600 is your exact color)" scale={colors.secondary} report={colors.reports.secondary} />
      ) : null}
      <ScaleRow name="Neutral" scale={colors.neutral} report={colors.reports.neutral} />
      {(Object.keys(colors.semantic) as (keyof typeof colors.semantic)[]).map((name) => (
        <ScaleRow key={name} name={name} scale={colors.semantic[name]} report={colors.reports.semantic[name]} />
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
