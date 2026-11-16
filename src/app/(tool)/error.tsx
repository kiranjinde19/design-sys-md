"use client";

import { ErrorView } from "@/components/site/error-view";

/** Shown when a page of this part of the app breaks. The rest of the page frame is gone, so it stands on its own. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView reset={reset} />;
}
