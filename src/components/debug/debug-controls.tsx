"use client";

import { Button } from "@/components/ui/button";
import { PRESETS, PRESET_IDS, useDesignSystem } from "@/lib/design-system";
import { Group } from "@/components/controls/controls";
import {
  BordersControls,
  ButtonControls,
  ColorsControls,
  RadiusControls,
  ShadowControls,
  SpacingControls,
  TypeScaleControls,
} from "@/components/controls/system-controls";

/** The left column of /debug: the preset switch, then one shared control panel per system. */
export function DebugControls() {
  const { presetId, isModified, applyPreset, reset } = useDesignSystem();

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Preset</h2>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_IDS.map((id) => (
            <Button key={id} size="sm" variant={id === presetId ? "default" : "outline"} onClick={() => applyPreset(id)}>
              {PRESETS[id].name}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {PRESETS[presetId].description}
          {isModified ? " (edited)" : ""}
        </p>
        {isModified ? (
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset to {PRESETS[presetId].name}
          </Button>
        ) : null}
      </div>

      <Group title="Colors">
        <ColorsControls />
      </Group>
      <Group title="Typography">
        <TypeScaleControls />
      </Group>
      <Group title="Radius, spacing and borders">
        <RadiusControls />
        <SpacingControls />
        <BordersControls />
      </Group>
      <Group title="Shadows">
        <ShadowControls />
      </Group>
      <Group title="Buttons">
        <ButtonControls />
      </Group>
    </div>
  );
}
