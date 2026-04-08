"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  return (
    <section className="noise-overlay py-16 md:py-24 bg-[#1a1816]">
      <div className="max-w-2xl mx-auto px-4 md:px-8 text-center">
        <h2 className="font-display text-3xl md:text-5xl lg:text-6xl leading-[0.9] mb-8 text-white">
          Gå aldrig glip af en kamp
        </h2>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setSuccess(false);
            setError("");
            trackEvent("newsletter_submit_started");

            try {
              const res = await fetch("/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, website }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                setError(data.error ?? "Kunne ikke tilmelde nyhedsbrev.");
                trackEvent("newsletter_submit_failed", { status: res.status });
                return;
              }
              setEmail("");
              setWebsite("");
              setSuccess(true);
              trackEvent("newsletter_submit_success");
            } catch {
              setError("Kunne ikke tilmelde nyhedsbrev.");
              trackEvent("newsletter_submit_failed", { status: 0 });
            } finally {
              setLoading(false);
            }
          }}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-4"
        >
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Din e-mail adresse"
            required
            className="flex-1 px-4 py-3 bg-[#f7f4ef] border border-[#3a3733] text-sm placeholder:text-[#8a847c] focus:outline-none focus:border-[#f7f4ef] transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#dc2626] text-white text-xs font-bold tracking-widest uppercase px-6 py-3 hover:bg-red-700 transition-colors"
          >
            {loading ? "..." : "Tilmeld"}
          </button>
        </form>
        {success && (
          <p className="text-[11px] text-green-400 mb-3">Tak. Du er nu tilmeldt nyhedsbrevet.</p>
        )}
        {error && (
          <p className="text-[11px] text-red-500 mb-3">{error}</p>
        )}

        <p className="text-[10px] text-[#5a5550]">
          Ved tilmelding accepterer du vores{" "}
          <a href="/privatlivspolitik" className="underline hover:text-[#a09890]">
            privatlivspolitik
          </a>
          .
        </p>
      </div>
    </section>
  );
}
