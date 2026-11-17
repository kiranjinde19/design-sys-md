"use client";

import {
  VOICE_AXES,
  useDesignSystem,
  voiceLevelLabel,
  voiceSummary,
  type VoiceAxis,
} from "@/lib/design-system";
import { RangeInput } from "@/components/controls/controls";
import { Section } from "@/components/controls/section";

function Slider({ axis }: { axis: (typeof VOICE_AXES)[number] }) {
  const { settings, update } = useDesignSystem();
  const value = settings.voice[axis.key];
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">{axis.title}</h3>
        <span className="text-xs text-muted-foreground">{voiceLevelLabel(axis.key, value)}</span>
      </div>
      <RangeInput
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

export function VoiceEditor() {
  const { settings } = useDesignSystem();
  
  return (
    <div className="space-y-10">
      <Section
        title="Tone of voice"
        description="How the product speaks. Three sliders set the tone. The five sample lines change with them in the Voice tab of the preview. The skill file records the voice, principles, word choices and do and don't pairs."
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
    </div>
  );
}
