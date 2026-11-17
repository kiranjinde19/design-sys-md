"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { voiceSummary, useDesignSystem } from "@/lib/design-system";
import { PvIcon } from "../preview-icon";
import { useVoiceCopy } from "../use-voice-copy";

/**
 * The five sample lines of the tone of voice, shown the way they appear in an interface and drawn with the skill file's
 * own classes. They change as the three tone sliders move. Sample lines only: they show a tone, not facts about a product.
 */
export function VoiceTab() {
  const copy = useVoiceCopy();
  const { settings } = useDesignSystem();
  return (
    <div className="pvx-page">
      <div className="pvx-head">
        <h1>Tone of voice</h1>
        <p>
          Current voice: {voiceSummary(settings.voice)}. Five sample lines, drawn the way they appear. Sample content.
        </p>
      </div>

      <div className="card" data-voice="button">
        <div className="pvx-card-head">
          <h2>Button label</h2>
        </div>
        <div style={{ display: "grid", gap: "var(--gap-inline)", justifyItems: "start" }}>
          <button type="button" className="btn btn--primary">
            {copy.button.main}
          </button>
          {copy.button.extra ? <p className="pvx-note">{copy.button.extra}</p> : null}
        </div>
      </div>

      <div className="card" data-voice="empty" style={{ textAlign: "center" }}>
        <div className="pvx-card-head">
          <h2>Empty state</h2>
        </div>
        <div style={{ display: "grid", gap: "var(--gap-inline)", justifyItems: "center" }}>
          <strong>{copy.empty.main}</strong>
          {copy.empty.extra ? <p className="pvx-note">{copy.empty.extra}</p> : null}
          <button type="button" className="btn btn--secondary">
            New project
          </button>
        </div>
      </div>

      <div className="pvx-toasts" data-voice="messages" style={{ gridColumn: "auto" }}>
        <div className="toast tone-error pvx-static" role="alert" data-voice="error">
          <span className="toast__icon">
            <PvIcon icon={CircleAlert} size={20} />
          </span>
          <div>
            <strong>{copy.error.main}</strong>
            {copy.error.extra ? <p className="pvx-note">{copy.error.extra}</p> : null}
          </div>
        </div>
        <div className="toast tone-success pvx-static" role="status" data-voice="success">
          <span className="toast__icon">
            <PvIcon icon={CircleCheck} size={20} />
          </span>
          <div>
            <strong>{copy.success.main}</strong>
            {copy.success.extra ? <p className="pvx-note">{copy.success.extra}</p> : null}
          </div>
        </div>
      </div>

      <div className="card" data-voice="pricing">
        <div className="pvx-card-head">
          <h2>Pricing call to action</h2>
          <p className="pvx-note">A tone example only. It is not a price or a term.</p>
        </div>
        <div style={{ display: "grid", gap: "var(--gap-inline)", justifyItems: "start" }}>
          <button type="button" className="btn btn--primary">
            {copy.pricing.main}
          </button>
          {copy.pricing.extra ? <p className="pvx-note">{copy.pricing.extra}</p> : null}
        </div>
      </div>
    </div>
  );
}
