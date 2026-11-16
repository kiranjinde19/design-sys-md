"use client";

import "./globals.css";
import { ErrorView } from "@/components/site/error-view";

/** The last resort: shown when something breaks so badly that no layout could render. It brings its own html. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ErrorView reset={reset} />
      </body>
    </html>
  );
}
