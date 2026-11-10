export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-24 text-center text-foreground">
      <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
        Are you building a solid app? Here is your first stone for the
        foundation.
      </h1>
      <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
        Stop shipping random blues and mismatched buttons. Teach your AI your
        brand first.
      </p>
    </main>
  );
}
