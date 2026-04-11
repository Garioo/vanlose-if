"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Match, Standing } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { sortMatchesByKickoff, formatMatchDate } from "@/lib/matchDate";
import { getTeamOutcome, isVanlose } from "@/lib/match-result";

type View = "KOMMENDE" | "RESULTATER";

interface Props {
  matches: Match[];
  standings: Standing[];
  teamLogoMap?: Record<string, string | null>;
  teamAbbreviationMap?: Record<string, string | null>;
}

function getTeamShortName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return parts
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function TeamMark({
  name,
  teamId,
  teamLogoMap,
  teamAbbreviationMap,
}: {
  name: string;
  teamId: string | null;
  teamLogoMap: Record<string, string | null>;
  teamAbbreviationMap: Record<string, string | null>;
}) {
  const logoUrl = teamId ? teamLogoMap[teamId] : null;
  const abbreviation = teamId ? teamAbbreviationMap[teamId] : null;
  const shortName = abbreviation || getTeamShortName(name);

  return (
    <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
      <span className="shrink-0 text-2xl font-black uppercase tracking-tight text-black md:text-[2rem]">
        {shortName}
      </span>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={name}
          className="h-14 w-14 shrink-0 object-contain md:h-16 md:w-16"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-black text-sm font-bold uppercase text-black md:h-16 md:w-16">
          {shortName}
        </div>
      )}
    </div>
  );
}

export default function KampeContent({
  matches,
  standings,
  teamLogoMap = {},
  teamAbbreviationMap = {},
}: Props) {
  const [view, setView] = useState<View>("KOMMENDE");
  const [liveMatches, setLiveMatches] = useState<Match[]>(matches);

  useEffect(() => {
    const channel = supabase
      .channel("kampe-matches")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        (payload) => {
          if (payload.new && typeof payload.new === "object") {
            const updated = payload.new as Match;
            setLiveMatches((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const upcoming = useMemo(
    () => sortMatchesByKickoff(liveMatches.filter((m) => m.is_upcoming), "asc"),
    [liveMatches],
  );
  const pastResults = useMemo(
    () => sortMatchesByKickoff(liveMatches.filter((m) => !m.is_upcoming), "desc"),
    [liveMatches],
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
                  return (
                    <Link
                      key={match.id}
                      href={`/kampe/${match.id}`}
                      className="card-lift block overflow-hidden border border-[#e0dbd3] bg-[#f7f4ef] transition-colors duration-200 hover:border-[#d4cfc7]"
                    >
                      <div className="border-b border-[#e0dbd3] bg-[#edeae3]/60 px-5 py-3 text-center md:px-6">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6b6560]">
                          {match.gruppe === "oprykning"
                            ? "Oprykningsspil"
                            : match.gruppe === "nedrykning"
                              ? "Nedrykningsspil"
                              : "3. Division"}
                        </p>
                        <div className="mt-2 text-2xl font-bold leading-tight text-black md:text-[2rem]">
                          {formatMatchDate(match.date)}
                        </div>
                        <div className="mt-1 text-lg font-semibold text-[#3f3a35]">
                          {match.time ? `Kl. ${match.time}` : "Tid kommer"}
                        </div>
                        {match.status === "live" && (
                          <div className="mx-auto mt-3 flex w-fit items-center gap-1.5 bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                            <span className="live-pulse inline-block h-1.5 w-1.5 rounded-full bg-white" />
                            LIVE
                          </div>
                        )}
                      </div>

                      <div className="px-5 py-6 md:px-6 md:py-7">
                        <div className="flex items-center justify-between gap-3">
                          <TeamMark
                            name={match.home}
                            teamId={match.home_team_id}
                            teamLogoMap={teamLogoMap}
                            teamAbbreviationMap={teamAbbreviationMap}
                          />
                          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a847c]">
                            VS
                          </span>
                          <TeamMark
                            name={match.away}
                            teamId={match.away_team_id}
                            teamLogoMap={teamLogoMap}
                            teamAbbreviationMap={teamAbbreviationMap}
                          />
                        </div>
                      </div>

                      <div className="border-t border-[#e0dbd3] px-5 py-4 text-center md:px-6">
                        <span className="text-sm font-bold text-red-600 underline decoration-red-600/60 underline-offset-4">
                          Se kampdetaljer
                        </span>
                        <p className="mt-2 text-xs text-[#6b6560]">
                          {match.venue || "Bane annonceres snart"}
                        </p>
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
                    className="card-lift flex items-center gap-4 border border-[#e0dbd3] px-4 py-3 transition-colors hover:bg-[#edeae3]"
                  >
                    <span className="w-16 shrink-0 text-[10px] font-bold text-[#6b6560]">
                      {formatMatchDate(r.date)}
                      {r.gruppe && r.gruppe !== "regular" && (
                        <span className={`ml-1 inline-block px-1 py-0.5 text-[8px] font-bold uppercase ${r.gruppe === "oprykning" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {r.gruppe === "oprykning" ? "OPR" : "NED"}
                        </span>
                      )}
                    </span>
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
                    {r.home_score != null && r.away_score != null && (() => {
                      const vanloseSide = isVanlose(r.home) ? "home" : "away";
                      const outcome = getTeamOutcome(r, vanloseSide);
                      const pill =
                        outcome === "win"
                          ? { label: "S", cls: "bg-[#166534] text-white" }
                          : outcome === "loss"
                            ? { label: "N", cls: "bg-[#7f1d1d] text-white" }
                            : { label: "U", cls: "bg-[#edeae3] text-[#4a4540]" };
                      return (
                        <span className={`shrink-0 px-2 py-1 text-[10px] font-bold ${pill.cls}`}>
                          {pill.label}
                        </span>
                      );
                    })()}
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
          {(() => {
            const isPlayoff = standings.some((r) => r.gruppe !== "regular");
            const groups: Array<{ key: string; label: string }> = isPlayoff
              ? [
                  { key: "oprykning", label: "OPRYKNINGSSPIL" },
                  { key: "nedrykning", label: "NEDRYKNINGSSPIL" },
                ]
              : [{ key: "regular", label: "STILLING" }];

            return (
              <>
                {groups.map(({ key, label }) => {
                  const rows = isPlayoff
                    ? standings.filter((r) => r.gruppe === key)
                    : standings;
                  return (
                    <div key={key} className="mb-8 last:mb-0">
                      <h2 className="font-display text-2xl mb-6">{label}</h2>
                      <div className="border border-[#e0dbd3] bg-[#f7f4ef]">
                        <div className="grid grid-cols-[24px_1fr_32px_40px_36px] border-b border-[#e0dbd3] bg-[#edeae3] px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[#6b6560]">
                          <span>#</span>
                          <span>Hold</span>
                          <span className="text-center">K</span>
                          <span className="text-center">+/-</span>
                          <span className="text-center">Pts</span>
                        </div>
                        {rows.map((row) => (
                          <div
                            key={row.id}
                            className={`grid grid-cols-[24px_1fr_32px_40px_36px] items-center border-b border-[#e0dbd3] px-3 py-3 text-xs font-bold last:border-0 ${
                              row.highlight ? "bg-black text-white" : "even:bg-[#edeae3]/40"
                            }`}
                          >
                            <span className={row.highlight ? "text-gray-300" : "text-[#6b6560]"}>{row.pos}</span>
                            <span className="uppercase tracking-wide truncate">{row.team}</span>
                            <span className="text-center">{row.played}</span>
                            <span className="text-center">
                              {((row.goals_scored ?? 0) - (row.goals_conceded ?? 0)) > 0
                                ? `+${(row.goals_scored ?? 0) - (row.goals_conceded ?? 0)}`
                                : (row.goals_scored ?? 0) - (row.goals_conceded ?? 0)}
                            </span>
                            <span className="text-center">{row.pts}</span>
                          </div>
                        ))}
                        {rows.length === 0 && (
                          <p className="text-xs text-[#8a847c] py-4 text-center">Ingen stilling.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
      </div>
    </>
  );
}
