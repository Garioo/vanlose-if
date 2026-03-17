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
      <div className="mx-auto flex max-w-7xl justify-end border-b border-[#e0dbd3] px-4 pb-6 md:px-8">
        <div className="flex gap-1 border border-[#e0dbd3] bg-[#edeae3] p-1">
          {(["KOMMENDE", "RESULTATER"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80 ${
                view === v ? "bg-black text-white" : "text-[#4a4540] hover:bg-[#ddd8d0] hover:text-black"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-3">
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
                      className="flex flex-col gap-4 border border-[#e0dbd3] bg-[#f7f4ef] px-5 py-5 transition-all duration-200 hover:border-[#d4cfc7] hover:shadow-sm md:px-6 md:py-6"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-center min-w-[84px]">
                          <div className="text-sm font-bold md:text-base">{match.date}</div>
                          <div className="text-xs text-[#6b6560]">
                            {match.time ? `Kl. ${match.time}` : "Tid kommer"}
                          </div>
                        </div>
                        <div
                          className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${
                            isHome
                              ? "bg-black text-white"
                              : "border border-[#e0dbd3] bg-[#edeae3] text-[#2e2b27]"
                          }`}
                        >
                          {isHome ? "HJEMME" : "UDE"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="truncate text-base font-bold uppercase md:text-lg">{match.home}</span>
                        <span className="text-xs text-[#8a847c] shrink-0">vs</span>
                        <span className="truncate text-base font-bold uppercase md:text-lg">{match.away}</span>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs text-[#4a4540] md:text-sm">
                          {match.venue || "Bane annonceres snart"}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#8a847c]">
                          Se kampdetaljer
                        </span>
                      </div>
                    </Link>
                  );
                })}
                {upcoming.length === 0 && (
                  <p className="text-xs text-[#8a847c] py-8 text-center">Ingen kommende kampe.</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="font-display text-2xl mb-6">RESULTATER</h2>
              <div className="space-y-2">
                {pastResults.map((r) => (
                  <Link
                    key={r.id}
                    href={`/kampe/${r.id}`}
                    className="flex items-center gap-4 border border-[#e0dbd3] px-4 py-3 transition-colors hover:bg-[#edeae3]"
                  >
                    <span className="w-16 shrink-0 text-[10px] font-bold text-[#6b6560]">{r.date}</span>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {(() => {
                        const homeOutcome = getTeamOutcome(r, "home");
                        const awayOutcome = getTeamOutcome(r, "away");
                        return (
                          <>
                            <span
                              className={`truncate text-xs font-bold uppercase ${
                                homeOutcome === "win"
                                  ? "text-black"
                                  : homeOutcome === "loss"
                                    ? "text-[#8a847c]"
                                    : isVanlose(r.home)
                                      ? "text-black"
                                      : "text-[#6b6560]"
                              }`}
                            >
                              {r.home}
                            </span>
                            <span className="shrink-0 border border-[#e0dbd3] bg-[#edeae3] px-3 py-1 text-sm font-bold">
                              {r.home_score} — {r.away_score}
                            </span>
                            <span
                              className={`truncate text-xs font-bold uppercase ${
                                awayOutcome === "win"
                                  ? "text-black"
                                  : awayOutcome === "loss"
                                    ? "text-[#8a847c]"
                                    : isVanlose(r.away)
                                      ? "text-black"
                                      : "text-[#6b6560]"
                              }`}
                            >
                              {r.away}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    {r.home_score != null && r.away_score != null && (
                      <span className="shrink-0 border border-[#e0dbd3] bg-[#f7f4ef] px-2 py-1 text-[10px] font-bold">
                        {r.home_score > r.away_score
                          ? "HJEMMESEJR"
                          : r.away_score > r.home_score
                            ? "UDESEJR"
                            : "UAFGJORT"}
                      </span>
                    )}
                  </Link>
                ))}
                {pastResults.length === 0 && (
                  <p className="text-xs text-[#8a847c] py-8 text-center">Ingen resultater endnu.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Standings sidebar */}
        <div>
          <h2 className="font-display text-2xl mb-6">STILLING</h2>
          <div className="border border-[#e0dbd3] bg-[#f7f4ef]">
            <div className="grid grid-cols-6 border-b border-[#e0dbd3] bg-[#edeae3] px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[#6b6560]">
              <span>#</span>
              <span className="col-span-2">Hold</span>
              <span className="text-center">K</span>
              <span className="text-center">+/-</span>
              <span className="text-center">Pts</span>
            </div>
            {standings.map((row) => (
              <div
                key={row.id}
                className={`grid grid-cols-6 items-center border-b border-[#e0dbd3] px-3 py-3 text-xs font-bold last:border-0 ${
                  row.highlight ? "bg-black text-white" : "even:bg-[#edeae3]/40"
                }`}
              >
                <span className={row.highlight ? "text-gray-300" : "text-[#6b6560]"}>{row.pos}</span>
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
              <p className="text-xs text-[#8a847c] py-4 text-center">Ingen stilling.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
