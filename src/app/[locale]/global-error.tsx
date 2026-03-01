"use client";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LocaleGlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-(--font-tokimeki) font-bold">Something went wrong</h1>
          <p className="text-sm text-white/75">Please retry. If the issue persists, start a new session.</p>
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:outline-none"
          >
            Retry
          </button>
          {error.digest && <p className="text-xs text-white/45">Error ID: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
