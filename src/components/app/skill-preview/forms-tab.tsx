"use client";

import { useState } from "react";

/** A settings style screen, drawn with the skill file's own classes. Invented names and example.com addresses only. */
export function FormsTab() {
  const [instant, setInstant] = useState(true);
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
        <form className="form" onSubmit={(event) => event.preventDefault()}>
          <div className="field">
            <label htmlFor="pv-name">Full name</label>
            <input id="pv-name" className="input" defaultValue="Alex Morgan" />
          </div>
          <div className="field">
            <label htmlFor="pv-email">Email</label>
            <input id="pv-email" className="input" aria-invalid="true" aria-describedby="pv-email-help" defaultValue="alex.morgan@example" />
            <p id="pv-email-help" className="field__help field__help--error">
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
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
