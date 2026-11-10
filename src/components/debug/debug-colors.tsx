"use client";

import {
  WHITE,
  pickReadableText,
  useDesignSystem,
  SCALE_STEPS,
  EXTRA_ROLE_NAMES,
  SHADCN_ROLE_NAMES,
  type ColorScale,
  type ContrastLevels,
  type ScaleGuidance,
  type ScaleReport,
} from "@/lib/design-system";
import { PassBadge, Section } from "./section";

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

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Roles (shadcn/ui names)</h3>
          <p className="text-xs text-muted-foreground">
            Each role maps to the shadcn CSS variable of the same name, for example primary-foreground is --primary-foreground. The card role follows the card style: for a tinted bento tile it is the brand 50 tint, with the card-border extra role as its brand 100 border, so bg-card matches the signature card. Chart colors 1 to 5 use distinct hues from the brand and status colors and differ in lightness for color blind readability.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[...SHADCN_ROLE_NAMES, ...EXTRA_ROLE_NAMES].map((role) => (
            <div key={role} className="flex items-center gap-3">
              <div
                className="size-10 shrink-0 rounded-lg border border-border"
                style={{ background: colors.roles[role] }}
              />
              <div className="min-w-0">
                <div className="truncate text-xs font-medium">
                  {role}
                  {(EXTRA_ROLE_NAMES as readonly string[]).includes(role) ? " (extra)" : ""}
                </div>
                <div className="font-mono text-xs text-muted-foreground">{colors.roles[role]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Chart colors and the color blindness check</h3>
          <p className="text-xs text-muted-foreground">
            Chart 1 is the brand color. The other four are spaced around the hue wheel (hues {colors.chartCheck.hues.join(", ")} degrees) with varied lightness. Every
            pair is compared under normal vision, deuteranopia, protanopia and tritanopia simulation (OKLab distance). The closest pair is charts{" "}
            {colors.chartCheck.worstPair.join(" and ")} under {colors.chartCheck.worstVision}: <span className="font-medium text-foreground">{colors.chartCheck.minDistance}</span>
            , against a bar of {colors.chartCheck.threshold}. {colors.chartCheck.passes ? "Passes." : "Does not pass."} Lowest contrast on the background: {colors.chartCheck.minContrast}:1 (needs 3:1).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
              <span className="size-6 rounded-md" style={{ background: colors.roles[`chart-${n}` as "chart-1"] }} />
              <span className="font-mono">chart-{n} {colors.roles[`chart-${n}` as "chart-1"]}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Smallest difference per vision type: normal {colors.chartCheck.perVision.normal}, deuteranopia {colors.chartCheck.perVision.deuteranopia}, protanopia {colors.chartCheck.perVision.protanopia}, tritanopia {colors.chartCheck.perVision.tritanopia}.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Role contrast checks</h3>
          <p className="text-xs text-muted-foreground">
            Text pairs need 4.5:1. Input outlines and focus rings are interface parts and need 3:1. Decorative borders and dividers are not checked. The three marks show 4.5, 3 and 7 (AAA).
          </p>
        </div>
        <div className="grid gap-2 lg:grid-cols-2">
          {colors.contrastPairs.map((pair) => (
            <div
              key={pair.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-10 w-12 shrink-0 items-center justify-center rounded-md border border-border text-sm font-semibold"
                  style={{ background: pair.background, color: pair.foreground }}
                >
                  Aa
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm">{pair.label}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {pair.foreground} on {pair.background}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {pair.levels.ratio.toFixed(2)}:1 · {levelsText(pair.levels)}
                  </div>
                </div>
              </div>
              <PassBadge passes={pair.passes} required={pair.required} />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
