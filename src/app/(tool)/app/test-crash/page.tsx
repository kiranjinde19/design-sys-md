import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

/**
 * A page that breaks on purpose, so a test can see the error page. It exists only when the server is started with
 * PLINTH_TEST_ROUTES=1 (the test runner does that). Anywhere else, including production, it is a plain 404.
 */
async function Crash(): Promise<never> {
  await connection();
  if (process.env.PLINTH_TEST_ROUTES !== "1") notFound();
  throw new Error("Deliberate test crash");
}

export default function TestCrash() {
  return (
    <Suspense>
      <Crash />
    </Suspense>
  );
}
