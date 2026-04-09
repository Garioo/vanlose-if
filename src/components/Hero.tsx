"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Match } from "@/lib/supabase";
import { getMatchSortTimestamp } from "@/lib/matchDate";

type HeroProps = {
  nextMatch: Match | null;
  heroImageUrl?: string | null;
  teamLogoMap?: Record<string, string | null>;
  teamAbbreviationMap?: Record<string, string | null>;
};

function getBadgeLabel(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function TeamBadge({ name, teamId, logoMap, darkBg }: { name: string; teamId: string | null; logoMap: Record<string, string | null>; darkBg?: boolean }) {
  const logoUrl = teamId ? logoMap[teamId] : null;
  if (logoUrl) {
    return (
      <div className="mb-1.5 flex h-12 w-16 items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={name} className="max-h-12 max-w-[3.5rem] object-contain" />
      </div>
    );
  }
  return (
    <div className={`mb-1.5 flex h-12 w-12 items-center justify-center rounded text-xs font-bold ${darkBg ? "bg-black text-white" : "bg-[#ddd8d0] text-black"}`}>
      {getBadgeLabel(name)}
    </div>
  );
}

function TeamMark({
  name,
  teamId,
  logoMap,
  abbreviationMap,
  darkBg,
  align,
}: {
  name: string;
  teamId: string | null;
  logoMap: Record<string, string | null>;
  abbreviationMap: Record<string, string | null>;
  darkBg?: boolean;
  align: "home" | "away";
}) {
  const label = (teamId && abbreviationMap[teamId]) || name;

  return (
    <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
      {align === "home" && (
        <span className="text-base font-bold uppercase tracking-tight text-black md:text-lg">
          {label}
        </span>
      )}
      <TeamBadge name={name} teamId={teamId} logoMap={logoMap} darkBg={darkBg} />
      {align === "away" && (
        <span className="text-base font-bold uppercase tracking-tight text-black md:text-lg">
          {label}
        </span>
      )}
    </div>
  );
}

export default function Hero({
  nextMatch,
  heroImageUrl,
  teamLogoMap = {},
  teamAbbreviationMap = {},
}: HeroProps) {
  const targetTimestamp = nextMatch ? getMatchSortTimestamp(nextMatch) : null;
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frameId = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <section className="noise-overlay relative flex h-screen min-h-[600px] items-end overflow-hidden bg-black text-white">
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
      </div>

      <div className={`relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-12 md:flex-row md:items-end md:justify-between md:px-8 md:pb-20${mounted ? " hero-enter" : ""}`}>
        {/* Left side - Title */}
        <div className="max-w-2xl">
          <h1 className="hero-title mb-7 max-w-[11ch] font-display text-5xl leading-[0.9] md:text-7xl lg:text-8xl">
            Vanløse Idrætsforening
          </h1>
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
          {nextMatch && nextMatch.status === "live" ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  LIVE
                </span>
                {nextMatch.live_minute != null && (
                  <span className="text-[10px] font-bold text-gray-500">{nextMatch.live_minute}&apos;</span>
                )}
              </div>
              <div className="mb-5 flex items-center justify-between gap-3">
                <TeamMark
                  name={nextMatch.home}
                  teamId={nextMatch.home_team_id}
                  logoMap={teamLogoMap}
                  abbreviationMap={teamAbbreviationMap}
                  darkBg
                  align="home"
                />
                <div className="text-center">
                  <span className="font-display text-3xl leading-none">
                    {nextMatch.home_score ?? 0} – {nextMatch.away_score ?? 0}
                  </span>
                </div>
                <TeamMark
                  name={nextMatch.away}
                  teamId={nextMatch.away_team_id}
                  logoMap={teamLogoMap}
                  abbreviationMap={teamAbbreviationMap}
                  align="away"
                />
              </div>
              <Link
                href={`/kampe/${nextMatch.id}`}
                className="block w-full bg-red-600 py-3 text-center text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                Se Live
              </Link>
            </>
          ) : nextMatch && targetTimestamp != null ? (
            <>
              <div className="-m-5 border border-[#e0dbd3] bg-[#f7f4ef] px-5 py-6 text-black md:-m-6 md:px-6 md:py-7">
                <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6c655f]">
                  Næste kamp
                </p>
                <div className="mb-7 text-center">
                  <div className="text-2xl font-bold leading-tight text-black md:text-[2rem]">
                    {nextMatch.date}
                  </div>
                  {nextMatch.time && (
                    <div className="mt-1 text-lg font-semibold leading-none text-[#3f3a35]">
                      Kl. {nextMatch.time}
                    </div>
                  )}
                </div>

                <div className="mb-7 flex items-center justify-between gap-3">
                  <TeamMark
                    name={nextMatch.home}
                    teamId={nextMatch.home_team_id}
                    logoMap={teamLogoMap}
                    abbreviationMap={teamAbbreviationMap}
                    darkBg
                    align="home"
                  />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a837b]">VS</span>
                  <TeamMark
                    name={nextMatch.away}
                    teamId={nextMatch.away_team_id}
                    logoMap={teamLogoMap}
                    abbreviationMap={teamAbbreviationMap}
                    align="away"
                  />
                </div>

                <Link
                  href={`/kampe/${nextMatch.id}`}
                  className="block text-center text-sm font-bold text-red-600 underline decoration-red-600/60 underline-offset-4 transition-colors hover:text-red-700"
                >
                  Se Match Center
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Sæsonen {new Date().getFullYear()}
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
