"use client";

import { useState } from "react";
import { CircleAlert, CircleCheck, Pencil, Copy, Trash2 } from "lucide-react";
import { useDesignSystem } from "@/lib/design-system";
import { PvIcon } from "../preview-icon";
import { useVoiceCopy } from "../use-voice-copy";

/** A settings style screen, drawn with the skill file's own classes. Invented names and example.com addresses only. */
export function FormsTab() {
  const [instant, setInstant] = useState(true);
  const copy = useVoiceCopy();
  const { tokens } = useDesignSystem();
  // Solid red belongs to the confirmation dialog when the brand is close to the error red.
  const solidDelete = tokens.controls.buttons.destructiveStyle === "tinted" ? "btn--destructive-solid" : "btn--destructive";
  return (
    <div className="pvx-page">
      <div className="pvx-head">
        <h1>Settings</h1>
        <p>Manage your profile and notifications. Sample content.</p>
      </div>

      <div className="card">
        <div className="pvx-card-head">
          <h2>Profile</h2>
          <p className="pvx-note">This is how you appear to your team.</p>
        </div>
        <form className="form pvx-form" onSubmit={(event) => event.preventDefault()}>
          <div className="field">
            <label htmlFor="pv-name">Full name</label>
            <input id="pv-name" className="input" defaultValue="Alex Morgan" />
          </div>
          <div className="field">
            <label htmlFor="pv-email">Email</label>
            <input id="pv-email" className="input" aria-invalid="true" aria-describedby="pv-email-help" defaultValue="alex.morgan@example" />
            <p id="pv-email-help" className="field__help field__help--error pvx-error">
              <PvIcon icon={CircleAlert} />
              Enter a full email address, like name@example.com.
            </p>
          </div>
          <div className="field">
            <label htmlFor="pv-role">Role</label>
            <select id="pv-role" className="input pvx-select" defaultValue="editor">
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="pv-org">Organization</label>
            <input id="pv-org" className="input" disabled defaultValue="Example Co." aria-describedby="pv-org-help" />
            <p id="pv-org-help" className="field__help">
              Managed by your admin. Contact support to change it.
            </p>
          </div>

          <fieldset className="pvx-fieldset">
            <legend>Billing</legend>
            <label className="pvx-choice">
              <input type="radio" name="pv-billing" className="radio" defaultChecked /> Monthly
            </label>
            <label className="pvx-choice">
              <input type="radio" name="pv-billing" className="radio" /> Yearly
            </label>
          </fieldset>

          <label className="pvx-choice">
            <input type="checkbox" className="check" defaultChecked /> I agree to the sample terms
          </label>

          <div className="pvx-switch-row">
            <div className="field">
              <label htmlFor="pv-updates">Email me product updates</label>
              <p className="field__help">Applies right away. There is no save button for this one.</p>
            </div>
            <button id="pv-updates" type="button" role="switch" aria-checked={instant} className="switch" onClick={() => setInstant(!instant)}>
              <span className="switch__thumb" />
            </button>
          </div>

          <div className="pvx-actions">
            <button type="button" className="btn btn--secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn--primary cta">
              {copy.button.main}
            </button>
          </div>
          {copy.button.extra ? <p className="field__help">{copy.button.extra}</p> : null}
        </form>
      </div>

      <section className="pvx-section" aria-label="Layers and shadows">
        <h2>Layers</h2>
        <div className="pvx-layers">
          <div className="pvx-menu" role="menu" aria-label="Sample menu">
            <button type="button" role="menuitem" className="pvx-menu__item">
              <PvIcon icon={Pencil} /> Rename
            </button>
            <button type="button" role="menuitem" className="pvx-menu__item is-hover">
              <PvIcon icon={Copy} /> Duplicate
            </button>
            <button type="button" role="menuitem" className="pvx-menu__item">
              <PvIcon icon={Trash2} /> Delete
            </button>
          </div>
          <div className="dialog pvx-static" role="dialog" aria-label="Sample confirmation">
            <h2 className="pvx-dialog-title">Delete this project?</h2>
            <p className="dialog__desc">This removes it for everyone. Sample text.</p>
            <div className="dialog__footer">
              <button type="button" className="btn btn--tertiary">
                Cancel
              </button>
              <button type="button" className={`btn ${solidDelete}`}>
                <PvIcon icon={Trash2} /> Delete project
              </button>
            </div>
          </div>
          <div className="pvx-toasts">
            <div className="toast tone-success pvx-static" role="status">
              <span className="toast__icon">
                <PvIcon icon={CircleCheck} size={20} />
              </span>
              <div>
                <strong>{copy.success.main}</strong>
                {copy.success.extra ? <p className="pvx-note">{copy.success.extra}</p> : null}
              </div>
            </div>
            <div className="toast tone-error pvx-static" role="alert">
              <span className="toast__icon">
                <PvIcon icon={CircleAlert} size={20} />
              </span>
              <div>
                <strong>{copy.error.main}</strong>
                <p className="pvx-note">{copy.error.extra}</p>
              </div>
            </div>
          </div>
        </div>
        <p className="pvx-note">Cards sit at shadow 1 and lift to 2 on hover. Menus use 3, toasts 4 and dialogs 5.</p>
      </section>
    </div>
  );
}
