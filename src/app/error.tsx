"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main-content"
      className="min-h-screen flex flex-col items-center justify-center bg-[#f7f4ef] text-[#0d0d0b] px-6 text-center"
    >
      <p className="text-[10px] font-bold tracking-widest uppercase text-[#8a847c] mb-4">Fejl</p>
      <h1 className="font-display text-4xl md:text-5xl leading-[0.9] mb-4">NOGET GIK GALT</h1>
      <p className="text-sm text-[#6b6560] mb-10 max-w-sm">
        Der opstod en uventet fejl. Prøv at genindlæse siden.
        {error.digest && (
          <span className="block mt-2 text-[10px] text-[#8a847c]">#{error.digest}</span>
        )}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={reset}
          className="text-xs font-bold tracking-widest uppercase bg-black text-white px-8 py-3 hover:bg-[#1a1a18] transition-colors"
        >
          Prøv igen
        </button>
        <Link
          href="/"
          className="text-xs font-bold tracking-widest uppercase border border-[#0d0d0b] px-8 py-3 hover:bg-[#0d0d0b] hover:text-[#f7f4ef] transition-colors"
        >
          Tilbage til forsiden
        </Link>
      </div>
    </main>
  );
}
