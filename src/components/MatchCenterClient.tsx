"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Match, MatchEvent, MatchLineup } from "@/lib/supabase";
import { isVanlose } from "@/lib/match-result";
import { formatClockSeconds, getLiveClockMinute, getLiveClockSeconds } from "@/lib/live-clock";

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

function formatPlayer(player: { name: string; number?: string | null; position?: string | null }) {
  const pieces = [player.number ? `#${player.number}` : null, player.name, player.position ?? null].filter(Boolean);
  return pieces.join(" · ");
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

  const isHome = useMemo(() => isVanlose(match.home), [match.home]);
  const liveSeconds = useMemo(() => getLiveClockSeconds(match, nowMs), [match, nowMs]);
  const liveMinute = useMemo(() => getLiveClockMinute(match, nowMs), [match, nowMs]);
  const liveClock = useMemo(() => formatClockSeconds(liveSeconds), [liveSeconds]);

  return (
    <div className="bg-white text-black min-h-screen pt-14">
      <section className="border-b border-gray-200 px-4 md:px-8 py-10 md:py-14 max-w-7xl mx-auto">
        <Link href="/kampe" className="text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-black">
          ← Tilbage til kampe
        </Link>

        <div className="mt-6 border border-gray-200 bg-black text-white p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-[10px] tracking-widest uppercase font-bold bg-white text-black px-2 py-1">
              {statusLabel(match)}
            </span>
            {liveMinute != null && (
              <span className="text-[10px] tracking-widest uppercase font-bold text-gray-300">
                {liveMinute}&apos;
              </span>
            )}
            {match.period_label && (
              <span className="text-[10px] tracking-widest uppercase font-bold text-gray-300">
                {match.period_label}
              </span>
            )}
            {match.status === "live" && (
              <span className="text-[10px] tracking-widest uppercase font-bold text-gray-300">
                {liveClock}
              </span>
            )}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <p className="text-lg md:text-2xl font-bold uppercase truncate">{match.home}</p>
            <p className="font-display text-3xl md:text-5xl tabular-nums">
              {match.home_score ?? 0} - {match.away_score ?? 0}
            </p>
            <p className="text-lg md:text-2xl font-bold uppercase truncate text-right">{match.away}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
          <p>{match.date}{match.time ? ` · Kl. ${match.time}` : ""}</p>
          <p className="md:text-right">{match.venue || "Bane annonceres snart"}</p>
          <p>{isHome ? "Vanløse spiller hjemme" : "Vanløse spiller ude"}</p>
          <Link href="/kontakt" className="md:text-right text-black font-bold tracking-wide uppercase text-[10px] hover:underline">
            Køb billet
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-2xl mb-4">LIVE TIDSLINJE</h2>
          <div className="border border-gray-200 divide-y divide-gray-100 bg-white">
            {events.map((event) => (
              <div key={event.id} className="px-4 py-3 flex items-start gap-3">
                <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 min-w-12">
                  {minuteLabel(event)}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide">
                    {event.event_type.replace("_", " ")}
                  </p>
                  <p className="text-xs text-gray-700">
                    {[event.player_name, event.assist_name ? `Assist: ${event.assist_name}` : null, event.note]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <span className="ml-auto text-[10px] uppercase tracking-widest text-gray-400">
                  {event.team_side === "home" ? "HJEMME" : "UDE"}
                </span>
              </div>
            ))}
            {events.length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-gray-400">Ingen events endnu.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-display text-2xl mb-4">VANLØSE LINEUP</h2>
          <div className="border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
                Formation: {lineup?.formation || "Ikke sat"}
              </p>
              <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
                {lineup?.confirmed ? "Bekræftet" : "Foreløbig"}
              </p>
            </div>

            <p className="text-xs font-bold tracking-wide uppercase mb-2">Startopstilling</p>
            <ul className="space-y-1 mb-5">
              {(lineup?.starters ?? []).map((player, index) => (
                <li key={`${player.name}-${index}`} className="text-xs text-gray-700">
                  {formatPlayer(player)}
                </li>
              ))}
              {(lineup?.starters ?? []).length === 0 && <li className="text-xs text-gray-400">Ikke tilgængelig endnu.</li>}
            </ul>

            <p className="text-xs font-bold tracking-wide uppercase mb-2">Bænk</p>
            <ul className="space-y-1">
              {(lineup?.bench ?? []).map((player, index) => (
                <li key={`${player.name}-${index}`} className="text-xs text-gray-700">
                  {formatPlayer(player)}
                </li>
              ))}
              {(lineup?.bench ?? []).length === 0 && <li className="text-xs text-gray-400">Ikke tilgængelig endnu.</li>}
            </ul>
          </div>
        </div>
      </section>

      {match.matchday_notes && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
          <div className="border border-gray-200 bg-gray-50 p-4">
            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">Kampnote</p>
            <p className="text-sm text-gray-700">{match.matchday_notes}</p>
          </div>
        </section>
      )}
    </div>
  );
}
