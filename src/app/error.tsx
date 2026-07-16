"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Structured client-side error log; replace with Sentry.captureException later.
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: "error", event: "client.error", digest: error.digest, message: error.message }));
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="eyebrow">Something spilled</p>
        <h1 className="mt-2 text-4xl">That didn&apos;t brew right.</h1>
        <p className="mt-4 opacity-70">
          The error has been logged{error.digest ? ` (ref ${error.digest})` : ""}. Try again, or head back to the menu.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button onClick={reset} className="btn-green">Try again</button>
          <Link href="/" className="btn-line">Back to home</Link>
        </div>
      </div>
    </div>
  );
}
