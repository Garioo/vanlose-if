"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Match } from "@/lib/supabase";
import { getMatchSortTimestamp } from "@/lib/matchDate";

function useCountdown(targetTimestamp: number | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (targetTimestamp == null) return;

    const tick = () => {
      const now = Date.now();
      const diff = targetTimestamp - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTimestamp]);

  return timeLeft;
}

type HeroProps = {
  nextMatch: Match | null;
  heroImageUrl?: string | null;
};

function CountdownDigit({ value }: { value: string }) {
  const [flip, setFlip] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      setFlip(true);
      prev.current = value;
      const t = setTimeout(() => setFlip(false), 260);
      return () => clearTimeout(t);
    }
  }, [value]);
  return <span className={`digit-flip${flip ? " flipping" : ""}`}>{value}</span>;
}

function getBadgeLabel(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

export default function Hero({ nextMatch, heroImageUrl }: HeroProps) {
  const targetTimestamp = nextMatch ? getMatchSortTimestamp(nextMatch) : null;
  const { days, hours, minutes, seconds } = useCountdown(targetTimestamp);
  const pad = (n: number) => String(n).padStart(2, "0");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="relative flex h-screen min-h-[600px] items-end overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt="Vanløse IF"
            fill
            className="object-cover object-center"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/50 to-black/80" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className={`relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-12 md:flex-row md:items-end md:justify-between md:px-8 md:pb-20${mounted ? " hero-enter" : ""}`}>
        {/* Left side - Title */}
        <div className="max-w-2xl">
          <div className="hero-badge mb-5 inline-block bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-black">
            Live fra København
          </div>
          <h1 className="hero-title mb-5 max-w-[12ch] font-display text-5xl leading-[0.9] md:text-7xl lg:text-8xl">
            Stolthed &<br />
            Passion
          </h1>
          <p className="hero-body mb-7 max-w-xl text-sm text-gray-100/95 md:text-base">
            Københavns mest ambitiøse klub. Oplev intensiteten på Vanløse Idrætspark. Siden 1921.
          </p>
          <div className="hero-cta flex flex-wrap gap-3">
            <Link
              href="/bliv-medlem"
              className="inline-block bg-red-600 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Bliv Medlem
            </Link>
            <Link
              href="/kampe"
              className="inline-block border border-white/80 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Se Kampprogram
            </Link>
          </div>
        </div>

        <div className="hero-card w-full flex-shrink-0 border border-gray-300/85 bg-white p-5 text-black shadow-xl md:w-[22rem] md:p-6">
          {nextMatch && targetTimestamp != null ? (
            <>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Næste Kamp
              </p>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {nextMatch.date}{nextMatch.time ? ` · Kl. ${nextMatch.time}` : ""}
              </div>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="text-center">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded bg-black text-xs font-bold text-white">
                    {getBadgeLabel(nextMatch.home)}
                  </div>
                  <span className="text-[10px] font-bold">{nextMatch.home}</span>
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase">vs</span>
                <div className="text-center">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded bg-[#ddd8d0] text-xs font-bold text-black">
                    {getBadgeLabel(nextMatch.away)}
                  </div>
                  <span className="text-[10px] font-bold">{nextMatch.away}</span>
                </div>
              </div>

              <div className="mb-5 flex gap-2">
                {[
                  { value: pad(days), label: "Dage" },
                  { value: pad(hours), label: "Timer" },
                  { value: pad(minutes), label: "Min" },
                  { value: pad(seconds), label: "Sek" },
                ].map((item) => (
                  <div key={item.label} className="countdown-box flex-1">
                    <div className="text-white text-lg font-bold leading-none"><CountdownDigit value={item.value} /></div>
                    <div className="text-gray-400 text-[9px] uppercase tracking-wider mt-1">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href={`/kampe/${nextMatch.id}`}
                className="block w-full bg-black py-3 text-center text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Se Match Center
              </Link>
            </>
          ) : (
            <>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Sæsonen 2026
              </p>
              <h2 className="mb-3 font-display text-3xl leading-[0.9]">
                Følg holdet gennem hele sæsonen
              </h2>
              <p className="mb-5 text-sm text-gray-600">
                Kampprogram, resultater og klubnyt bliver opdateret løbende.
              </p>
              <Link
                href="/kampe"
                className="block w-full bg-black py-3 text-center text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Se Kampprogram
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
