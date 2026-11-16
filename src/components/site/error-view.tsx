"use client";

import { FEEDBACK_HREF, StatusPage } from "./status-page";

/** Something went wrong: try again, or send feedback. Used by the error pages of the landing page, the tool and the whole app. */
export function ErrorView({ reset }: { reset: () => void }) {
  return (
    <StatusPage title="Something went wrong" line="Your work in the tool is saved in this browser. Try again, and if it keeps happening, send feedback.">
      <button type="button" className="st-btn" onClick={reset}>
        Try again
      </button>
      <a className="st-link" href={FEEDBACK_HREF}>
        Send feedback
      </a>
    </StatusPage>
  );
}
