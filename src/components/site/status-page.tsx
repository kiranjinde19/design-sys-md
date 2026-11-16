import Link from "next/link";
import type { ReactNode } from "react";
import { PlinthWordmark } from "@/components/brand/plinth-wordmark";
import { fontClasses } from "@/components/landing/fonts";
import "./status.css";

/** The feedback address, the same one the landing page uses. */
export const FEEDBACK_HREF = "mailto:kiranjinde19@gmail.com?subject=Plinth%20feedback";

/** The frame of the 404 and error pages: the wordmark, a title, one line and the actions. */
export function StatusPage({ title, line, children }: { title: string; line: string; children: ReactNode }) {
  return (
    <div className={`st ${fontClasses}`} data-status-page>
      <div className="st-wrap">
        <header className="st-top">
          <Link className="st-mark" href="/" aria-label="Plinth home" prefetch={false}>
            <PlinthWordmark height={24} />
          </Link>
        </header>
        <main className="st-main">
          <h1>{title}</h1>
          <p className="st-line">{line}</p>
          <div className="st-actions">{children}</div>
        </main>
      </div>
    </div>
  );
}

/** Page not found. */
export function NotFoundView() {
  return (
    <StatusPage title="This page does not exist" line="The link may be old or mistyped.">
      <Link className="st-btn" href="/" prefetch={false}>
        Go to the home page
      </Link>
      <Link className="st-btn outline" href="/app" prefetch={false}>
        Open Plinth
      </Link>
    </StatusPage>
  );
}
