"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Match, MatchEvent, MatchLineup } from "@/lib/supabase";
import { isVanlose } from "@/lib/match-result";
import { formatClockSeconds, getLiveClockMinute, getLiveClockSeconds } from "@/lib/live-clock";
import LineupPitch, { type PlayerEventSummary } from "@/components/LineupPitch";

type Props = {
  initialMatch: Match;
  initialEvents: MatchEvent[];
  initialLineup: MatchLineup | null;
  lineupSide: "home" | "away";
};

function statusLabel(match: Match): string {
  if (match.status === "live") return "LIVE";
  if (match.status === "finished") return "SLUT";
  return "KOMMENDE";
}

function minuteLabel(event: MatchEvent): string {
  if (event.minute == null) return "—";
  if (event.stoppage_minute != null && event.stoppage_minute > 0) {
    return `${event.minute}+${event.stoppage_minute}'`;
  }
  return `${event.minute}'`;
}

function EventIcon({ type }: { type: string }) {
  const t = type.toLowerCase();
  const isGoal = t === "goal" || t === "mål" || t === "penalty" || t === "straffe";
  const isOwnGoal = t === "own_goal" || t === "selvmål";
  const isYellow = t === "yellow_card" || t === "gult_kort";
  const isRed = t === "red_card" || t === "rødt_kort";
  const isSub = t === "substitution" || t === "udskiftning";

  if (isGoal || isOwnGoal) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 3.5 L9.5 6.5 L13 7 L10.5 9.5 L11 13 L8 11.5 L5 13 L5.5 9.5 L3 7 L6.5 6.5 Z" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.15" />
      </svg>
    );
  }
  if (isYellow) {
    return (
      <svg width="12" height="16" viewBox="0 0 12 16" fill="none" aria-hidden>
        <rect x="1" y="1" width="10" height="14" rx="1.5" fill="#d97706" stroke="#d97706" strokeWidth="1" />
      </svg>
    );
  }
  if (isRed) {
    return (
      <svg width="12" height="16" viewBox="0 0 12 16" fill="none" aria-hidden>
        <rect x="1" y="1" width="10" height="14" rx="1.5" fill="#dc2626" stroke="#dc2626" strokeWidth="1" />
      </svg>
    );
  }
  if (isSub) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M5 3 L5 13 M5 3 L2 6 M5 3 L8 6" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 13 L11 3 M11 13 L8 10 M11 13 L14 10" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return <span style={{ width: 16, display: "inline-block", textAlign: "center", color: "currentColor" }}>·</span>;
}

function eventColor(type: string): string {
  switch (type.toLowerCase()) {
    case "goal":
    case "mål":
    case "penalty":
    case "straffe":
      return "#e63329";
    case "own_goal":
    case "selvmål":
      return "#6b7280";
    case "yellow_card":
    case "gult_kort":
      return "#d97706";
    case "red_card":
    case "rødt_kort":
      return "#dc2626";
    case "substitution":
    case "udskiftning":
      return "#2563eb";
    default:
      return "#6b7280";
  }
}

function eventLabel(type: string): string {
  switch (type.toLowerCase()) {
    case "goal": return "MÅL";
    case "mål": return "MÅL";
    case "own_goal": return "SELVMÅL";
    case "selvmål": return "SELVMÅL";
    case "yellow_card": return "GULT KORT";
    case "gult_kort": return "GULT KORT";
    case "red_card": return "RØDT KORT";
    case "rødt_kort": return "RØDT KORT";
    case "substitution": return "UDSKIFTNING";
    case "udskiftning": return "UDSKIFTNING";
    case "penalty": return "STRAFFESPARK";
    case "straffe": return "STRAFFESPARK";
    default: return type.replace(/_/g, " ").toUpperCase();
  }
}

export default function MatchCenterClient({ initialMatch, initialEvents, initialLineup, lineupSide }: Props) {
  const [match, setMatch] = useState<Match>(initialMatch);
  const [events, setEvents] = useState<MatchEvent[]>(initialEvents);
  const [lineup, setLineup] = useState<MatchLineup | null>(initialLineup);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const [matchRes, eventRes, lineupRes] = await Promise.all([
          fetch(`/api/matches/${match.id}`, { cache: "no-store" }),
          fetch(`/api/matches/${match.id}/events`, { cache: "no-store" }),
          fetch(`/api/matches/${match.id}/lineup?team_side=${lineupSide}`, { cache: "no-store" }),
        ]);
        if (cancelled) return;

        if (matchRes.ok) {
          const nextMatch = (await matchRes.json()) as Match;
          setMatch(nextMatch);
        }

        if (eventRes.ok) {
          const nextEvents = (await eventRes.json()) as MatchEvent[];
          setEvents(Array.isArray(nextEvents) ? nextEvents : []);
        }

        if (lineupRes.ok) {
          const nextLineup = (await lineupRes.json()) as MatchLineup | null;
          setLineup(nextLineup);
        }
      } catch {
        // keep current snapshot on polling errors
      }
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [match.id, lineupSide]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const prevScore = useRef({ home: match.home_score, away: match.away_score });
  const scoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const homeChanged = match.home_score !== prevScore.current.home;
    const awayChanged = match.away_score !== prevScore.current.away;
    if ((homeChanged || awayChanged) && scoreRef.current) {
      scoreRef.current.classList.add("score-flash");
      prevScore.current = { home: match.home_score, away: match.away_score };
      const t = setTimeout(() => scoreRef.current?.classList.remove("score-flash"), 1500);
      return () => clearTimeout(t);
    }
  }, [match.home_score, match.away_score]);

  const isHome = useMemo(() => isVanlose(match.home), [match.home]);
  const liveSeconds = useMemo(() => getLiveClockSeconds(match, nowMs), [match, nowMs]);
  const liveMinute = useMemo(() => getLiveClockMinute(match, nowMs), [match, nowMs]);
  const liveClock = useMemo(() => formatClockSeconds(liveSeconds), [liveSeconds]);

  const playerEvents = useMemo(() => {
    const map: Record<string, PlayerEventSummary> = {};
    const key = (name: string) => name.trim().toLowerCase();
    const get = (name: string): PlayerEventSummary => {
      const k = key(name);
      if (!map[k]) map[k] = { goals: 0, assists: 0, yellowCard: false, redCard: false, subOut: false, subIn: false };
      return map[k]!;
    };
    for (const e of events) {
      if (e.player_name) {
        const s = get(e.player_name);
        if (e.event_type === "goal") s.goals++;
        if (e.event_type === "yellow_card") s.yellowCard = true;
        if (e.event_type === "red_card") s.redCard = true;
        if (e.event_type === "substitution") s.subOut = true;
      }
      if (e.assist_name && e.event_type === "goal") {
        get(e.assist_name).assists++;
      }
      if (e.assist_name && e.event_type === "substitution") {
        get(e.assist_name).subIn = true;
      }
    }
    return map;
  }, [events]);
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  return (
    <div className="bg-[#f7f4ef] text-[#0d0d0b] min-h-screen pt-14">

      {/* Back link */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-4">
        <Link
          href="/kampe"
          className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#8a847c] hover:text-[#0d0d0b] transition-colors"
        >
          <span>←</span> Tilbage til kampe
        </Link>
      </div>

      {/* Scoreboard hero */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-8">
        <div
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #0d0d0b 0%, #1a1a17 60%, #0d0d0b 100%)",
          }}
        >
          {/* Subtle grid texture */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              pointerEvents: "none",
            }}
          />

          {/* Red top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#e63329]" />

          <div className="relative px-6 md:px-10 py-8 md:py-10">
            {/* Status row */}
            <div className="flex items-center gap-3 mb-4">
              {isLive ? (
                <span className="inline-flex items-center gap-2 bg-[#e63329] text-white px-3 py-1 text-[10px] font-bold tracking-widest uppercase">
                  <span className="inline-block w-[7px] h-[7px] rounded-full bg-white animate-pulse" />
                  LIVE
                </span>
              ) : (
                <span className="inline-flex items-center bg-white/10 text-white/70 px-3 py-1 text-[10px] font-bold tracking-widest uppercase">
                  {statusLabel(match)}
                </span>
              )}
              {isLive && (
                <span className="font-display text-3xl md:text-4xl tracking-widest" style={{ color: "#e63329" }}>
                  {liveClock}
                </span>
              )}
              <span className="ml-auto text-white/30 text-[10px] tracking-widest uppercase hidden md:block">
                3. Division
              </span>
            </div>

            {/* Teams and score */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-8">
              {/* Home team */}
              <div>
                <p className="font-display text-2xl md:text-4xl lg:text-5xl text-white leading-none tracking-tight">
                  {match.home}
                </p>
                {isHome && (
                  <p className="text-[9px] text-[#e63329] font-bold tracking-widest uppercase mt-2">
                    Hjemmehold
                  </p>
                )}
              </div>

              {/* Score */}
              <div ref={scoreRef} className="text-center px-4 md:px-8">
                <div className="font-display text-5xl md:text-7xl lg:text-8xl text-white leading-none tabular-nums">
                  {match.home_score ?? 0}
                  <span className="text-white/30 mx-1 md:mx-2">-</span>
                  {match.away_score ?? 0}
                </div>
                {isFinished && (
                  <p className="text-[9px] text-white/40 font-bold tracking-widest uppercase mt-2">
                    Slutresultat
                  </p>
                )}
              </div>

              {/* Away team */}
              <div className="text-right">
                <p className="font-display text-2xl md:text-4xl lg:text-5xl text-white leading-none tracking-tight">
                  {match.away}
                </p>
                {!isHome && (
                  <p className="text-[9px] text-[#e63329] font-bold tracking-widest uppercase mt-2">
                    Hjemmehold
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom meta strip */}
          <div className="border-t border-white/10 px-6 md:px-10 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-6 text-[11px] text-white/50">
              <span>
                {match.date}{match.time ? ` · Kl. ${match.time}` : ""}
              </span>
              {match.venue && (
                <>
                  <span className="text-white/20">|</span>
                  <span>{match.venue}</span>
                </>
              )}
              <span className="text-white/20">|</span>
              <span>{isHome ? "Vanløse spiller hjemme" : "Vanløse spiller ude"}</span>
            </div>
            <a
              href="#tidslinje"
              className="text-[10px] font-bold tracking-widest uppercase text-[#e63329] hover:text-white transition-colors"
            >
              Følg kampen ↓
            </a>
          </div>
        </div>
      </section>

      {/* Timeline + Lineup */}
      <section
        id="tidslinje"
        className="max-w-7xl mx-auto px-4 md:px-8 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"
      >
        {/* Timeline */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-3xl tracking-tight">LIVE TIDSLINJE</h2>
            {isLive && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-[#e63329]">
                <span className="inline-block w-[6px] h-[6px] rounded-full bg-[#e63329] animate-pulse" />
                Opdateres live
              </span>
            )}
          </div>

          {events.length === 0 ? (
            <div className="border border-[#e0dbd3] bg-white/60 px-6 py-12 text-center">
              <p className="text-xs text-[#8a847c] tracking-wide">
                {isFinished ? "Ingen registrerede hændelser." : "Ingen events endnu — hold øje her."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#e0dbd3] border border-[#e0dbd3] bg-white/60">
              {[...events].reverse().map((event) => {
                const color = eventColor(event.event_type);
                return (
                  <div key={event.id} className="flex items-stretch gap-0">
                    {/* Colored left border */}
                    <div style={{ width: 3, backgroundColor: color, flexShrink: 0 }} />

                    <div className="flex items-center gap-4 px-4 py-4 flex-1 min-w-0">
                      {/* Minute */}
                      <span
                        className="text-[11px] font-bold tabular-nums min-w-[36px] text-right"
                        style={{ color }}
                      >
                        {minuteLabel(event)}
                      </span>

                      {/* Icon */}
                      <span className="flex-shrink-0 text-[#8a847c]">
                        <EventIcon type={event.event_type} />
                      </span>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color }}>
                          {eventLabel(event.event_type)}
                        </p>
                        <p className="text-sm font-semibold text-[#0d0d0b] truncate">
                          {event.player_name ?? "—"}
                        </p>
                        {(event.assist_name || event.note) && (
                          <p className="text-[11px] text-[#8a847c] truncate">
                            {[
                              event.assist_name ? `${event.event_type === "substitution" ? "Ind" : "Assist"}: ${event.assist_name}` : null,
                              event.note,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>

                      {/* Side */}
                      <span className="text-[9px] font-bold tracking-widest uppercase text-[#c0bab3] ml-auto flex-shrink-0">
                        {event.team_side === "home" ? "HJEMME" : "UDE"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lineup */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-3xl tracking-tight">VANLØSE LINEUP</h2>
            <span
              className="text-[10px] font-bold tracking-widest uppercase px-2 py-1"
              style={{
                color: lineup?.confirmed ? "#166534" : "#8a847c",
                backgroundColor: lineup?.confirmed ? "#dcfce7" : "#f0ede8",
              }}
            >
              {lineup?.confirmed ? "✓ Bekræftet" : "Foreløbig"}
            </span>
          </div>

          {lineup && lineup.starters.length > 0 ? (
            <LineupPitch
              starters={lineup.starters}
              bench={lineup.bench}
              formation={lineup.formation}
              confirmed={lineup.confirmed}
              playerEvents={playerEvents}
            />
          ) : (
            <div className="border border-[#e0dbd3] bg-white/60 px-6 py-12 text-center">
              <p className="text-xs text-[#8a847c] tracking-wide">
                {isFinished ? "Ingen lineup registreret." : "Lineup annonceres snart."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Matchday note */}
      {match.matchday_notes && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
          <div className="border-l-[3px] border-[#e63329] bg-white/60 border border-[#e0dbd3] px-6 py-5">
            <p className="text-[9px] font-bold tracking-widest uppercase text-[#8a847c] mb-2">Kampnote</p>
            <p className="text-sm text-[#0d0d0b] leading-relaxed">{match.matchday_notes}</p>
          </div>
        </section>
      )}
    </div>
  );
}
