"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-dvh flex items-center justify-center bg-[#141417] text-[#ededf0]">
        <div className="text-center px-4">
          <h1 className="text-2xl font-semibold mb-2">Application error</h1>
          <p className="text-sm text-[#8b8b96] mb-4">Something broke at the root level.</p>
          <button
            onClick={reset}
            className="h-10 px-4 rounded-md bg-[#5b8cff] text-white text-sm"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
