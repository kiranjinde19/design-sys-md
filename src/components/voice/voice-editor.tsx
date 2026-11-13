"use client";

import {
  VOICE_AXES,
  buildVoiceSamples,
  useDesignSystem,
  voiceLevelLabel,
  voiceSummary,
  type VoiceAxis,
  type VoiceSample,
} from "@/lib/design-system";
import { Section } from "@/components/controls/section";
import { usePreviewStage } from "@/components/preview/preview-stage";

function Slider({ axis }: { axis: (typeof VOICE_AXES)[number] }) {
  const { settings, update } = useDesignSystem();
  const value = settings.voice[axis.key];
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">{axis.title}</h3>
        <span className="text-xs text-muted-foreground">{voiceLevelLabel(axis.key, value)}</span>
      </div>
      <input
        type="range"
        className="w-full accent-primary"
        min={1}
        max={5}
        step={1}
        value={value}
        aria-label={`${axis.title}: ${axis.low} to ${axis.high}`}
        aria-valuetext={voiceLevelLabel(axis.key, value)}
        onChange={(event) => update({ voice: { [axis.key]: Number(event.target.value) } as Partial<Record<VoiceAxis, number>> })}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{axis.low}</span>
        <span>{axis.high}</span>
      </div>
    </div>
  );
}

/** One sample line, shown the way it would really appear in the interface. */
function Preview({ sample }: { sample: VoiceSample }) {
  const { tokens, small } = usePreviewStage();
  const { colors, controls } = tokens;
  const button = controls.buttons.variants.primary.default;
  const secondary = controls.buttons.variants.secondary.default;
  const error = colors.semantic.error;
  const success = colors.semantic.success;
  const muted = colors.roles["muted-foreground"];

  const buttonStyle = (variant: typeof button) => ({
    height: controls.buttons.height.md,
    paddingInline: controls.buttons.paddingX.md,
    borderRadius: controls.buttons.radius,
    background: variant.background,
    color: variant.color,
    border: `${controls.buttons.borderWidth}px solid ${variant.borderColor}`,
    fontWeight: controls.buttons.fontWeight,
    fontFamily: "inherit",
    fontSize: "inherit",
  });

  let body;
  if (sample.id === "button") {
    body = (
      <div className="space-y-2">
        <button type="button" tabIndex={-1} style={buttonStyle(button)}>
          {sample.main}
        </button>
        {sample.extra ? <p style={{ color: muted, fontSize: small.px }}>{sample.extra}</p> : null}
      </div>
    );
  } else if (sample.id === "pricing") {
    body = (
      <div className="space-y-2">
        <button type="button" tabIndex={-1} style={buttonStyle(button)}>
          {sample.main}
        </button>
        {sample.extra ? <p style={{ color: muted, fontSize: small.px }}>{sample.extra}</p> : null}
      </div>
    );
  } else if (sample.id === "error") {
    body = (
      <div className="space-y-1 rounded-lg p-3" style={{ background: error[50], color: error[800], border: `1px solid ${error[100]}` }}>
        <p className="font-medium">{sample.main}</p>
        {sample.extra ? <p style={{ fontSize: small.px }}>{sample.extra}</p> : null}
      </div>
    );
  } else if (sample.id === "success") {
    body = (
      <div className="space-y-1 rounded-lg p-3" style={{ background: success[50], color: success[800], border: `1px solid ${success[100]}` }}>
        <p className="font-medium">{sample.main}</p>
        {sample.extra ? <p style={{ fontSize: small.px }}>{sample.extra}</p> : null}
      </div>
    );
  } else {
    body = (
      <div className="space-y-1 py-2 text-center">
        <p className="font-medium">{sample.main}</p>
        {sample.extra ? <p style={{ color: muted, fontSize: small.px }}>{sample.extra}</p> : null}
        <button type="button" tabIndex={-1} className="mt-2" style={buttonStyle(secondary)}>
          New project
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-border p-4">
      <div className="text-xs font-medium text-muted-foreground">{sample.label}</div>
      {body}
    </div>
  );
}

export function VoiceEditor() {
  const { settings } = useDesignSystem();
  const { stage } = usePreviewStage();
  const samples = buildVoiceSamples(settings.voice);

  return (
    <div className="space-y-10">
      <Section
        title="Tone of voice"
        description="How the product speaks. Three sliders set the tone, and the five lines below change with them. The skill file records the voice, principles, word choices and do and don't pairs."
      >
        <div className="grid gap-6 rounded-xl border border-border p-5 @lg:grid-cols-3">
          {VOICE_AXES.map((axis) => (
            <Slider key={axis.key} axis={axis} />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Current voice: <span className="font-medium text-foreground">{voiceSummary(settings.voice)}</span>.
        </p>
      </Section>

      <Section
        title="Live preview"
        description="Five lines, shown the way they appear in the interface. They show a tone, not facts about your product."
      >
        <div className="grid gap-3 @lg:grid-cols-2" style={stage}>
          {samples.map((sample) => (
            <Preview key={sample.id} sample={sample} />
          ))}
        </div>
      </Section>
    </div>
  );
}
