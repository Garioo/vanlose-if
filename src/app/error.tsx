"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">Fejl</p>
      <h1 className="font-display text-4xl mb-4">NOGET GIKK GALT</h1>
      <p className="text-sm text-gray-500 mb-8 max-w-sm">
        Der opstod en uventet fejl. Prøv at genindlæse siden.
        {error.digest && (
          <span className="block mt-2 text-[10px] text-gray-300">#{error.digest}</span>
        )}
      </p>
      <button
        onClick={reset}
        className="text-xs font-bold tracking-widest uppercase bg-black text-white px-8 py-3 hover:bg-gray-900 transition-colors"
      >
        PRØV IGEN
      </button>
    </div>
  );
}
