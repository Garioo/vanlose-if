"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Match, Standing } from "@/lib/supabase";
import { sortMatchesByKickoff } from "@/lib/matchDate";
import { getTeamOutcome, isVanlose } from "@/lib/match-result";

type View = "KOMMENDE" | "RESULTATER";

interface Props {
  matches: Match[];
  standings: Standing[];
}

export default function KampeContent({ matches, standings }: Props) {
  const [view, setView] = useState<View>("KOMMENDE");

  const upcoming = useMemo(
    () => sortMatchesByKickoff(matches.filter((m) => m.is_upcoming), "asc"),
    [matches],
  );
  const pastResults = useMemo(
    () => sortMatchesByKickoff(matches.filter((m) => !m.is_upcoming), "desc"),
    [matches],
  );

  return (
    <>
      {/* Toggle */}
      <div className="border-b border-gray-200 px-4 md:px-8 pb-6 max-w-7xl mx-auto flex justify-end">
        <div className="flex border border-gray-200">
          {(["KOMMENDE", "RESULTATER"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-[10px] font-bold tracking-widest uppercase px-5 py-3 transition-colors ${
                view === v ? "bg-black text-white" : "text-gray-400 hover:text-black"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main table */}
        <div className="lg:col-span-2">
          {view === "KOMMENDE" ? (
            <div>
              <h2 className="font-display text-2xl mb-6">KOMMENDE KAMPE</h2>
              <div className="space-y-4">
                {upcoming.map((match) => {
                  const isHome = isVanlose(match.home);
                  return (
                    <Link
                      key={match.id}
                      href={`/kampe/${match.id}`}
                      className="border border-gray-200 bg-white px-5 py-5 md:px-6 md:py-6 flex flex-col gap-4"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-center min-w-[84px]">
                          <div className="text-sm md:text-base font-bold">{match.date}</div>
                          <div className="text-xs text-gray-500">{match.time ? `Kl. ${match.time}` : "Tid kommer"}</div>
                        </div>
                        <div className={`text-[11px] font-bold tracking-widest uppercase px-3 py-1 ${isHome ? "bg-black text-white" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                          {isHome ? "HJEMME" : "UDE"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-base md:text-lg font-bold uppercase truncate">{match.home}</span>
                        <span className="text-xs text-gray-400 shrink-0">vs</span>
                        <span className="text-base md:text-lg font-bold uppercase truncate">{match.away}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                        <span className="text-xs md:text-sm text-gray-600">{match.venue || "Bane annonceres snart"}</span>
                        <a
                          href="/kontakt"
                          className="inline-flex items-center justify-center text-[11px] font-bold tracking-widest uppercase bg-black text-white px-4 py-2.5 hover:bg-gray-900 transition-colors whitespace-nowrap"
                        >
                          KØB BILLET
                        </a>
                      </div>
                    </Link>
                  );
                })}
                {upcoming.length === 0 && (
                  <p className="text-xs text-gray-400 py-8 text-center">Ingen kommende kampe.</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="font-display text-2xl mb-6">RESULTATER</h2>
              <div className="divide-y divide-gray-100">
                {pastResults.map((r) => (
                  <Link key={r.id} href={`/kampe/${r.id}`} className="py-4 flex items-center gap-4">
                    <span className="text-[10px] font-bold text-gray-400 w-16 shrink-0">{r.date}</span>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {(() => {
                        const homeOutcome = getTeamOutcome(r, "home");
                        const awayOutcome = getTeamOutcome(r, "away");
                        return (
                          <>
                      <span
                        className={`text-xs font-bold uppercase truncate ${
                          homeOutcome === "win"
                            ? "text-black"
                            : homeOutcome === "loss"
                              ? "text-gray-400"
                              : isVanlose(r.home)
                                ? "text-black"
                                : "text-gray-500"
                        }`}
                      >
                        {r.home}
                      </span>
                      <span className="text-sm font-bold shrink-0 px-3 py-1 bg-gray-50 border border-gray-200">
                        {r.home_score} — {r.away_score}
                      </span>
                      <span
                        className={`text-xs font-bold uppercase truncate ${
                          awayOutcome === "win"
                            ? "text-black"
                            : awayOutcome === "loss"
                              ? "text-gray-400"
                              : isVanlose(r.away)
                                ? "text-black"
                                : "text-gray-500"
                        }`}
                      >
                        {r.away}
                      </span>
                          </>
                        );
                      })()}
                    </div>
                    {r.home_score != null && r.away_score != null && (
                      <span className="text-[10px] font-bold px-2 py-1 border border-gray-300 shrink-0">
                        {r.home_score > r.away_score ? "HJEMMESEJR" : r.away_score > r.home_score ? "UDESEJR" : "UAFGJORT"}
                      </span>
                    )}
                  </Link>
                ))}
                {pastResults.length === 0 && (
                  <p className="text-xs text-gray-400 py-8 text-center">Ingen resultater endnu.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Standings sidebar */}
        <div>
          <h2 className="font-display text-2xl mb-6">STILLING</h2>
          <div className="border border-gray-200">
            <div className="grid grid-cols-6 text-[9px] font-bold tracking-widest uppercase text-gray-400 px-3 py-2 border-b border-gray-200 bg-gray-50">
              <span>#</span>
              <span className="col-span-2">Hold</span>
              <span className="text-center">K</span>
              <span className="text-center">+/-</span>
              <span className="text-center">Pts</span>
            </div>
            {standings.map((row) => (
              <div
                key={row.id}
                className={`grid grid-cols-6 items-center px-3 py-3 text-xs font-bold border-b border-gray-100 last:border-0 ${
                  row.highlight ? "bg-black text-white" : ""
                }`}
              >
                <span className="text-gray-400">{row.pos}</span>
                <span className="col-span-2 uppercase tracking-wide truncate">{row.team}</span>
                <span className="text-center">{row.played}</span>
                <span className="text-center">
                  {((row.goals_scored ?? 0) - (row.goals_conceded ?? 0)) > 0
                    ? `+${(row.goals_scored ?? 0) - (row.goals_conceded ?? 0)}`
                    : (row.goals_scored ?? 0) - (row.goals_conceded ?? 0)}
                </span>
                <span className="text-center">{row.pts}</span>
              </div>
            ))}
            {standings.length === 0 && (
              <p className="text-xs text-gray-400 py-4 text-center">Ingen stilling.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
