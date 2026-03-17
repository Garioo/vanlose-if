"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Match, MatchEvent, MatchLineup, Player, LineupPlayerSlot } from "@/lib/supabase";
import { isVanlose } from "@/lib/match-result";
import { formatClockSeconds, getLiveClockMinute, getLiveClockSeconds } from "@/lib/live-clock";
import type { LiveAction } from "@/lib/matchday-payload";
import { sortMatchesByKickoff } from "@/lib/matchDate";
import { sortPlayersByNumber } from "@/lib/playerSort";
import LineupPitch from "@/components/LineupPitch";

function createEmptyEventForm() {
  return {
    team_side: "home" as "home" | "away",
    event_type: "goal" as MatchEvent["event_type"],
    minute: "",
    stoppage_minute: "",
    player_name: "",
    assist_name: "",
    note: "",
  };
}

function createEmptyLineupForm() {
  return {
    formation: "4-3-3",
    confirmed: false,
    starters: [] as string[],
    bench: [] as string[],
    captain: "",
    goalkeeper: "",
  };
}

function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase("da-DK");
}

function parseStatusLabel(status: Match["status"]): string {
  if (status === "live") return "LIVE";
  if (status === "finished") return "SLUT";
  return "KOMMENDE";
}

function formatMatchDateTime(match: Pick<Match, "date" | "time" | "kickoff_at">): string {
  if (match.kickoff_at) {
    const kickoffDate = new Date(match.kickoff_at);
    if (!Number.isNaN(kickoffDate.getTime())) {
      return kickoffDate.toLocaleString("da-DK", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  if (match.time) {
    return `${match.date} ${match.time}`;
  }

  return match.date;
}

function parseApiError(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string" && error.trim().length > 0) {
      return error;
    }
  }
  return fallback;
}

function toNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function formatEventType(eventType: MatchEvent["event_type"]): string {
  return eventType.replace(/_/g, " ");
}

export default function AdminLivePage() {
  const [requestedMatchId, setRequestedMatchId] = useState<string | null>(null);

  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [lineup, setLineup] = useState<MatchLineup | null>(null);

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingLive, setSavingLive] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [savingLineup, setSavingLineup] = useState(false);

  const [eventForm, setEventForm] = useState(createEmptyEventForm);
  const [lineupForm, setLineupForm] = useState(createEmptyLineupForm);

  const [quickTeamSide, setQuickTeamSide] = useState<"home" | "away">("home");
  const [quickPlayerName, setQuickPlayerName] = useState("");
  const [quickAssistName, setQuickAssistName] = useState("");
  const [quickNote, setQuickNote] = useState("");
  const [matchdayNotes, setMatchdayNotes] = useState("");
  const [matchFilter, setMatchFilter] = useState("");

  const [nowMs, setNowMs] = useState(() => Date.now());

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) ?? null,
    [matches, selectedMatchId],
  );

  const filteredMatches = useMemo(() => {
    const query = normalizeName(matchFilter);
    if (!query) return matches;

    return matches.filter((match) => {
      const haystack = [
        match.home,
        match.away,
        match.venue ?? "",
        formatMatchDateTime(match),
      ].join(" ");
      return normalizeName(haystack).includes(query);
    });
  }, [matches, matchFilter]);

  function getVanloseSide(match: Pick<Match, "home">): "home" | "away" {
    return isVanlose(match.home) ? "home" : "away";
  }

  const updateMatchState = useCallback((updated: Match) => {
    setMatches((prev) => {
      const next = prev.some((item) => item.id === updated.id)
        ? prev.map((item) => (item.id === updated.id ? updated : item))
        : [...prev, updated];
      return sortMatchesByKickoff(next, "desc");
    });
  }, []);

  const load = useCallback(async () => {
    const [matchesRes, playersRes] = await Promise.all([
      fetch("/api/matches"),
      fetch("/api/players"),
    ]);

    const [matchesData, playersData] = await Promise.all([
      matchesRes.json().catch(() => []),
      playersRes.json().catch(() => []),
    ]);

    const nextMatches = Array.isArray(matchesData)
      ? sortMatchesByKickoff(matchesData as Match[], "desc")
      : [];
    const nextPlayers = Array.isArray(playersData)
      ? sortPlayersByNumber(playersData as Player[], "asc")
      : [];

    setMatches(nextMatches);
    setPlayers(nextPlayers);

    setSelectedMatchId((prev) => {
      if (prev && nextMatches.some((m) => m.id === prev)) {
        return prev;
      }
      if (requestedMatchId && nextMatches.some((m) => m.id === requestedMatchId)) {
        return requestedMatchId;
      }
      return nextMatches[0]?.id ?? null;
    });
  }, [requestedMatchId]);

  const loadMatchday = useCallback(async (matchId: string, teamSide: "home" | "away") => {
    const [eventRes, lineupRes] = await Promise.all([
      fetch(`/api/matches/${matchId}/events`),
      fetch(`/api/matches/${matchId}/lineup?team_side=${teamSide}`),
    ]);

    const eventData = await eventRes.json().catch(() => []);
    const lineupData = await lineupRes.json().catch(() => null);

    setEvents(Array.isArray(eventData) ? eventData : []);
    const nextLineup = lineupData && typeof lineupData === "object" ? (lineupData as MatchLineup) : null;
    setLineup(nextLineup);

    if (!nextLineup) {
      setLineupForm(createEmptyLineupForm());
      return;
    }

    const byName = new Map(players.map((p) => [normalizeName(p.name), p.id]));
    const starterIds = (nextLineup.starters ?? [])
      .map((slot) => byName.get(normalizeName(slot.name)))
      .filter((id): id is string => Boolean(id));
    const benchIds = (nextLineup.bench ?? [])
      .map((slot) => byName.get(normalizeName(slot.name)))
      .filter((id): id is string => Boolean(id));

    const captainSlot = [...(nextLineup.starters ?? []), ...(nextLineup.bench ?? [])].find((slot) => slot.captain);
    const goalkeeperSlot = [...(nextLineup.starters ?? []), ...(nextLineup.bench ?? [])].find((slot) => slot.goalkeeper);

    setLineupForm({
      formation: nextLineup.formation ?? "4-3-3",
      confirmed: Boolean(nextLineup.confirmed),
      starters: starterIds,
      bench: benchIds,
      captain: captainSlot ? byName.get(normalizeName(captainSlot.name)) ?? "" : "",
      goalkeeper: goalkeeperSlot ? byName.get(normalizeName(goalkeeperSlot.name)) ?? "" : "",
    });
  }, [players]);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("match");
    setRequestedMatchId(value);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!requestedMatchId) return;
    if (!matches.some((m) => m.id === requestedMatchId)) return;
    setSelectedMatchId(requestedMatchId);
  }, [requestedMatchId, matches]);

  useEffect(() => {
    if (!selectedMatchId) return;
    const match = matches.find((row) => row.id === selectedMatchId);
    if (!match) return;
    setQuickTeamSide(getVanloseSide(match));
    setMatchdayNotes(match.matchday_notes ?? "");
    void loadMatchday(selectedMatchId, getVanloseSide(match));
  }, [selectedMatchId, matches, loadMatchday]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function sendLiveAction(action: LiveAction, payload?: { period_label?: string | null; matchday_notes?: string | null }) {
    if (!selectedMatch) return;

    setSavingLive(true);
    setError(null);

    const res = await fetch(`/api/admin/matches/${selectedMatch.id}/live`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });

    const data = await res.json().catch(() => ({}));
    setSavingLive(false);

    if (!res.ok) {
      setError(parseApiError(data, "Kunne ikke opdatere live-status."));
      return;
    }

    const updated = data as Match;
    updateMatchState(updated);
    setMatchdayNotes(updated.matchday_notes ?? "");
  }

  async function handlePlayPause() {
    if (!selectedMatch || selectedMatch.status === "finished") return;

    if (selectedMatch.live_clock_running) {
      await sendLiveAction("pause");
      return;
    }

    if (selectedMatch.live_phase === "pre_match" || selectedMatch.status === "scheduled") {
      await sendLiveAction("start");
      return;
    }

    await sendLiveAction("resume_second_half");
  }

  function startEditEvent(event: MatchEvent) {
    setEditingEventId(event.id);
    setEventForm({
      team_side: event.team_side,
      event_type: event.event_type,
      minute: event.minute != null ? String(event.minute) : "",
      stoppage_minute: event.stoppage_minute != null ? String(event.stoppage_minute) : "",
      player_name: event.player_name ?? "",
      assist_name: event.assist_name ?? "",
      note: event.note ?? "",
    });
  }

  async function submitEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMatch) return;

    setSavingEvent(true);
    setError(null);

    const liveMinute = getLiveClockMinute(selectedMatch, Date.now()) ?? 0;
    const payload = {
      ...eventForm,
      minute: toNumber(eventForm.minute) ?? liveMinute,
      stoppage_minute: toNumber(eventForm.stoppage_minute),
    };

    const res = editingEventId
      ? await fetch(`/api/admin/matches/${selectedMatch.id}/events/${editingEventId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch(`/api/admin/matches/${selectedMatch.id}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    const data = await res.json().catch(() => ({}));
    setSavingEvent(false);

    if (!res.ok) {
      setError(parseApiError(data, "Kunne ikke gemme event."));
      return;
    }

    setEventForm(createEmptyEventForm());
    setEditingEventId(null);
    await loadMatchday(selectedMatch.id, getVanloseSide(selectedMatch));
  }

  async function createQuickEvent(eventType: MatchEvent["event_type"]) {
    if (!selectedMatch) return;

    setSavingEvent(true);
    setError(null);

    const minute = getLiveClockMinute(selectedMatch, Date.now()) ?? 0;

    const payload = {
      team_side: quickTeamSide,
      event_type: eventType,
      minute,
      stoppage_minute: null,
      player_name: quickPlayerName.trim() || null,
      assist_name: quickAssistName.trim() || null,
      note: quickNote.trim() || null,
    };

    const res = await fetch(`/api/admin/matches/${selectedMatch.id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    setSavingEvent(false);

    if (!res.ok) {
      setError(parseApiError(data, "Kunne ikke oprette event."));
      return;
    }

    setQuickNote("");
    await loadMatchday(selectedMatch.id, getVanloseSide(selectedMatch));
  }

  async function deleteEvent(eventId: string) {
    if (!selectedMatch) return;
    const res = await fetch(`/api/admin/matches/${selectedMatch.id}/events/${eventId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(parseApiError(data, "Kunne ikke slette event."));
      return;
    }

    await loadMatchday(selectedMatch.id, getVanloseSide(selectedMatch));
  }

  function togglePlayer(playerId: string, field: "starters" | "bench") {
    setLineupForm((prev) => {
      const existing = new Set(prev[field]);
      if (existing.has(playerId)) {
        existing.delete(playerId);
      } else {
        existing.add(playerId);
      }
      return {
        ...prev,
        [field]: Array.from(existing),
      };
    });
  }

  function moveStarter(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    setLineupForm((prev) => {
      if (newIndex < 0 || newIndex >= prev.starters.length) return prev;
      const next = [...prev.starters];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return { ...prev, starters: next };
    });
  }

  function buildLineupSlots(playerIds: string[]): LineupPlayerSlot[] {
    return playerIds
      .map((id) => players.find((p) => p.id === id))
      .filter((player): player is Player => Boolean(player))
      .map((player) => ({
        name: player.name,
        number: player.number,
        position: player.position,
        captain: lineupForm.captain === player.id,
        goalkeeper: lineupForm.goalkeeper === player.id,
      }));
  }

  async function submitLineup(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMatch) return;

    const duplicate = lineupForm.starters.some((id) => lineupForm.bench.includes(id));
    if (duplicate) {
      setError("Samme spiller kan ikke være i både startopstilling og bænken.");
      return;
    }

    setSavingLineup(true);
    setError(null);

    const payload = {
      team_side: getVanloseSide(selectedMatch),
      formation: lineupForm.formation,
      confirmed: lineupForm.confirmed,
      starters: buildLineupSlots(lineupForm.starters),
      bench: buildLineupSlots(lineupForm.bench),
    };

    const res = await fetch(`/api/admin/matches/${selectedMatch.id}/lineup`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    setSavingLineup(false);

    if (!res.ok) {
      setError(parseApiError(data, "Kunne ikke gemme lineup."));
      return;
    }

    await loadMatchday(selectedMatch.id, getVanloseSide(selectedMatch));
  }

  const inputCls = "w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors";
  const labelCls = "block text-[10px] font-bold tracking-widest uppercase mb-1 text-gray-600";

  const liveSeconds = selectedMatch ? getLiveClockSeconds(selectedMatch, nowMs) : 0;
  const liveMinute = selectedMatch ? getLiveClockMinute(selectedMatch, nowMs) ?? 0 : 0;
  const liveClock = formatClockSeconds(liveSeconds);

  const primaryLiveLabel = selectedMatch?.live_clock_running ? "Pause" : "Play";

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Admin</p>
          <h1 className="font-display text-3xl">LIVEKONTROL</h1>
        </div>
        <Link href="/admin/kampe" className="text-[10px] font-bold tracking-widest uppercase border border-gray-300 px-4 py-2.5 hover:border-black">
          Til kampe
        </Link>
      </div>

      {error && <p className="mb-4 text-xs text-red-500">{error}</p>}

      <div className="bg-white border border-gray-200 mb-8">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Find kamp</label>
              <input
                type="text"
                value={matchFilter}
                onChange={(e) => setMatchFilter(e.target.value)}
                className={inputCls}
                placeholder="Søg på hold, bane eller dato..."
              />
            </div>
            <div>
              <label className={labelCls}>Aktiv kamp</label>
              <select
                value={selectedMatchId ?? ""}
                onChange={(e) => setSelectedMatchId(e.target.value || null)}
                className={`${inputCls} bg-white`}
              >
                <option value="">Vælg kamp</option>
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {formatMatchDateTime(match)} · {match.home} vs {match.away}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-12 text-[9px] font-bold tracking-widest uppercase text-gray-400 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <span className="col-span-2">Dato</span>
          <span className="col-span-4">Kamp</span>
          <span className="col-span-2">Score</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2 text-right">Handlinger</span>
        </div>
        {filteredMatches.map((m) => (
          <div key={m.id} className={`grid grid-cols-12 items-center px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 ${selectedMatchId === m.id ? "bg-blue-50 border-l-2 border-l-blue-600" : ""}`}>
            <button onClick={() => setSelectedMatchId(m.id)} className="col-span-2 text-left text-[10px] text-gray-400 hover:text-black">
              {formatMatchDateTime(m)}
            </button>
            <button onClick={() => setSelectedMatchId(m.id)} className="col-span-4 text-left hover:underline">
              <p className="text-xs font-bold uppercase truncate">{m.home} — {m.away}</p>
              <p className="text-[10px] text-gray-400 truncate">{m.venue || "Bane mangler"}</p>
            </button>
            <span className="col-span-2 text-xs text-gray-600">{m.home_score != null ? `${m.home_score}–${m.away_score}` : "—"}</span>
            <span className={`col-span-2 text-[10px] font-bold uppercase ${m.status === "live" ? "text-red-500" : m.status === "finished" ? "text-gray-500" : "text-blue-500"}`}>
              {parseStatusLabel(m.status)}{m.status === "live" ? ` ${formatClockSeconds(getLiveClockSeconds(m, nowMs))}` : ""}
            </span>
            <div className="col-span-2 flex items-center justify-end gap-2">
              <button onClick={() => setSelectedMatchId(m.id)} className="text-[10px] font-bold tracking-widest uppercase text-blue-600 hover:text-blue-800">
                Vælg
              </button>
            </div>
          </div>
        ))}
        {matches.length === 0 && <div className="px-4 py-8 text-center text-xs text-gray-400">Ingen kampe endnu.</div>}
        {matches.length > 0 && filteredMatches.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-gray-400">Ingen kampe matcher søgningen.</div>
        )}
      </div>

      {selectedMatch && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="text-xs font-bold tracking-widest uppercase mb-2">Live kontrol</h2>
              <p className="text-xs text-gray-500 mb-4">{selectedMatch.home} — {selectedMatch.away}</p>

              <div className="mb-4 p-4 border border-gray-200 bg-black text-white text-center">
                <p className="text-[10px] tracking-widest uppercase text-gray-300 mb-2">{selectedMatch.period_label || "Kampur"}</p>
                <p className="font-display text-5xl tabular-nums leading-none">{liveClock}</p>
                <p className="text-xs text-gray-300 mt-2">{liveMinute}&apos; · {parseStatusLabel(selectedMatch.status)}</p>
              </div>

              <button
                type="button"
                disabled={savingLive || selectedMatch.status === "finished"}
                onClick={() => void handlePlayPause()}
                className="w-full bg-black text-white text-sm font-bold tracking-widest uppercase px-4 py-3 disabled:opacity-50"
              >
                {savingLive ? "Arbejder..." : primaryLiveLabel}
              </button>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <button type="button" disabled={savingLive} onClick={() => void sendLiveAction("start")} className="border border-gray-300 px-3 py-2 text-[10px] font-bold tracking-widest uppercase hover:border-black disabled:opacity-50">Start kamp</button>
                <button type="button" disabled={savingLive} onClick={() => void sendLiveAction("pause")} className="border border-gray-300 px-3 py-2 text-[10px] font-bold tracking-widest uppercase hover:border-black disabled:opacity-50">Pause (halvleg)</button>
                <button type="button" disabled={savingLive} onClick={() => void sendLiveAction("resume_second_half")} className="border border-gray-300 px-3 py-2 text-[10px] font-bold tracking-widest uppercase hover:border-black disabled:opacity-50">Start 2. halvleg</button>
                <button type="button" disabled={savingLive} onClick={() => void sendLiveAction("finish")} className="border border-gray-300 px-3 py-2 text-[10px] font-bold tracking-widest uppercase hover:border-black disabled:opacity-50">Afslut kamp</button>
              </div>

              <div className="mt-4">
                <label className={labelCls}>Matchday note</label>
                <div className="flex gap-2">
                  <input type="text" value={matchdayNotes} onChange={(e) => setMatchdayNotes(e.target.value)} className={inputCls} placeholder="Kort live note..." />
                  <button type="button" onClick={() => void sendLiveAction("set_note", { matchday_notes: matchdayNotes })} className="border border-gray-300 px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:border-black">
                    Gem
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6">
              <h2 className="text-xs font-bold tracking-widest uppercase mb-4">Events (hurtig)</h2>

              {(() => {
                const lineupPlayers = [...(lineup?.starters ?? []), ...(lineup?.bench ?? [])];
                const isVanloseSide = quickTeamSide === getVanloseSide(selectedMatch);
                const showSelect = isVanloseSide && lineupPlayers.length > 0;

                return (
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <select value={quickTeamSide} onChange={(e) => setQuickTeamSide(e.target.value as "home" | "away")} className={`${inputCls} bg-white`}>
                      <option value="home">Hjemme</option>
                      <option value="away">Ude</option>
                    </select>

                    {showSelect ? (
                      <select value={quickPlayerName} onChange={(e) => setQuickPlayerName(e.target.value)} className={`${inputCls} bg-white`}>
                        <option value="">— Vælg spiller —</option>
                        {lineupPlayers.map((p) => (
                          <option key={p.name} value={p.name}>{p.number ? `#${p.number} ` : ""}{p.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input value={quickPlayerName} onChange={(e) => setQuickPlayerName(e.target.value)} className={inputCls} placeholder="Spiller" />
                    )}

                    {showSelect ? (
                      <select value={quickAssistName} onChange={(e) => setQuickAssistName(e.target.value)} className={`${inputCls} bg-white`}>
                        <option value="">— Assist (valgfri) —</option>
                        {lineupPlayers.map((p) => (
                          <option key={p.name} value={p.name}>{p.number ? `#${p.number} ` : ""}{p.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input value={quickAssistName} onChange={(e) => setQuickAssistName(e.target.value)} className={inputCls} placeholder="Assist (valgfri)" />
                    )}

                    <input value={quickNote} onChange={(e) => setQuickNote(e.target.value)} className={inputCls} placeholder="Note (valgfri)" />
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <button type="button" disabled={savingEvent} onClick={() => void createQuickEvent("goal")} className="bg-black text-white text-[10px] font-bold tracking-widest uppercase px-3 py-2.5 disabled:opacity-50">Mål ({liveMinute}&apos;)</button>
                <button type="button" disabled={savingEvent} onClick={() => void createQuickEvent("yellow_card")} className="border border-gray-300 text-[10px] font-bold tracking-widest uppercase px-3 py-2.5 hover:border-black disabled:opacity-50">Gult ({liveMinute}&apos;)</button>
                <button type="button" disabled={savingEvent} onClick={() => void createQuickEvent("red_card")} className="border border-gray-300 text-[10px] font-bold tracking-widest uppercase px-3 py-2.5 hover:border-black disabled:opacity-50">Rødt ({liveMinute}&apos;)</button>
                <button type="button" disabled={savingEvent} onClick={() => void createQuickEvent("substitution")} className="border border-gray-300 text-[10px] font-bold tracking-widest uppercase px-3 py-2.5 hover:border-black disabled:opacity-50">Udskiftning ({liveMinute}&apos;)</button>
              </div>

              <h3 className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-3">Manuel override</h3>
              <form onSubmit={submitEvent} className="grid grid-cols-2 gap-3 mb-5">
                <select value={eventForm.team_side} onChange={(e) => setEventForm({ ...eventForm, team_side: e.target.value as "home" | "away" })} className={`${inputCls} bg-white`}>
                  <option value="home">Hjemme</option>
                  <option value="away">Ude</option>
                </select>
                <select value={eventForm.event_type} onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value as MatchEvent["event_type"] })} className={`${inputCls} bg-white`}>
                  <option value="goal">Mål</option>
                  <option value="yellow_card">Gult kort</option>
                  <option value="red_card">Rødt kort</option>
                  <option value="substitution">Udskiftning</option>
                  <option value="kickoff">Kickoff</option>
                  <option value="halftime">Pause</option>
                  <option value="fulltime">Slut</option>
                </select>
                <input type="number" min="0" placeholder={`Minut (default ${liveMinute})`} value={eventForm.minute} onChange={(e) => setEventForm({ ...eventForm, minute: e.target.value })} className={inputCls} />
                <input type="number" min="0" placeholder="Tillæg" value={eventForm.stoppage_minute} onChange={(e) => setEventForm({ ...eventForm, stoppage_minute: e.target.value })} className={inputCls} />
                {(() => {
                  const lineupPlayers = [...(lineup?.starters ?? []), ...(lineup?.bench ?? [])];
                  const showSelect = eventForm.team_side === getVanloseSide(selectedMatch) && lineupPlayers.length > 0;
                  return (
                    <>
                      {showSelect ? (
                        <select value={eventForm.player_name} onChange={(e) => setEventForm({ ...eventForm, player_name: e.target.value })} className={`${inputCls} bg-white`}>
                          <option value="">— Vælg spiller —</option>
                          {lineupPlayers.map((p) => (
                            <option key={p.name} value={p.name}>{p.number ? `#${p.number} ` : ""}{p.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input type="text" placeholder="Spiller" value={eventForm.player_name} onChange={(e) => setEventForm({ ...eventForm, player_name: e.target.value })} className={inputCls} />
                      )}
                      {showSelect ? (
                        <select value={eventForm.assist_name} onChange={(e) => setEventForm({ ...eventForm, assist_name: e.target.value })} className={`${inputCls} bg-white`}>
                          <option value="">— Assist (valgfri) —</option>
                          {lineupPlayers.map((p) => (
                            <option key={p.name} value={p.name}>{p.number ? `#${p.number} ` : ""}{p.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input type="text" placeholder="Assist" value={eventForm.assist_name} onChange={(e) => setEventForm({ ...eventForm, assist_name: e.target.value })} className={inputCls} />
                      )}
                    </>
                  );
                })()}
                <input type="text" placeholder="Note" value={eventForm.note} onChange={(e) => setEventForm({ ...eventForm, note: e.target.value })} className={`${inputCls} col-span-2`} />
                <div className="col-span-2 flex gap-2">
                  <button type="submit" disabled={savingEvent} className="bg-black text-white text-[10px] font-bold tracking-widest uppercase px-4 py-2.5 disabled:opacity-50">
                    {savingEvent ? "Gemmer..." : editingEventId ? "Opdatér event" : "Tilføj event"}
                  </button>
                  {editingEventId && (
                    <button type="button" onClick={() => { setEditingEventId(null); setEventForm(createEmptyEventForm()); }} className="border border-gray-300 text-[10px] font-bold tracking-widest uppercase px-4 py-2.5 hover:border-black">
                      Annullér
                    </button>
                  )}
                </div>
              </form>

              <div className="border border-gray-200 divide-y divide-gray-100">
                {events.map((event) => (
                  <div key={event.id} className="px-4 py-3 flex items-start gap-3">
                    <div className="min-w-[52px] text-[10px] font-bold tracking-widest uppercase text-gray-400">
                      {event.minute != null ? `${event.minute}${event.stoppage_minute ? `+${event.stoppage_minute}` : ""}'` : "—"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide">{formatEventType(event.event_type)}</p>
                      <p className="text-xs text-gray-600">{[event.player_name, event.assist_name ? `Assist: ${event.assist_name}` : null, event.note].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => startEditEvent(event)} className="text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-black">Redigér</button>
                      <button type="button" onClick={() => void deleteEvent(event.id)} className="text-[10px] font-bold tracking-widest uppercase text-red-400 hover:text-red-600">Slet</button>
                    </div>
                  </div>
                ))}
                {events.length === 0 && <p className="px-4 py-6 text-xs text-gray-400">Ingen events endnu.</p>}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6 h-fit">
            <h2 className="text-xs font-bold tracking-widest uppercase mb-4">Vanløse lineup</h2>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Form */}
              <form onSubmit={submitLineup}>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <input type="text" value={lineupForm.formation} onChange={(e) => setLineupForm({ ...lineupForm, formation: e.target.value })} className={inputCls} placeholder="4-3-3" />
                  <label className="inline-flex items-center gap-2 text-xs text-gray-600 border border-gray-300 px-3 py-2">
                    <input type="checkbox" checked={lineupForm.confirmed} onChange={(e) => setLineupForm({ ...lineupForm, confirmed: e.target.checked })} />
                    Bekræftet
                  </label>
                </div>

                {/* Ordered starters */}
                <div className="mb-4">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">
                    Startopstilling ({lineupForm.starters.length}/11) — rækkefølge bestemmer position
                  </p>
                  {(() => {
                    const rowCounts = lineupForm.formation
                      .split("-").map((n) => parseInt(n, 10)).filter((n) => !isNaN(n) && n > 0);
                    const rowLabels = rowCounts.map((count, i) => {
                      if (i === 0) return `FORSVAR (${count})`;
                      if (i === rowCounts.length - 1) return `ANGREB (${count})`;
                      return `MIDTBANE (${count})`;
                    });
                    // Boundary indices in the non-GK starters list
                    const boundaries: number[] = [];
                    let cursor = 0;
                    for (const count of rowCounts) { boundaries.push(cursor); cursor += count; }

                    // Map overall starter index → non-GK index
                    let nonGkIdx = 0;

                    return (
                      <div>
                        <div className="border border-gray-200 divide-y divide-gray-100 mb-2">
                          {lineupForm.starters.length === 0 && (
                            <p className="px-3 py-4 text-xs text-gray-400 text-center">Ingen spillere valgt endnu.</p>
                          )}
                          {lineupForm.starters.map((id, i) => {
                            const player = players.find((p) => p.id === id);
                            if (!player) return null;
                            const isGK = id === lineupForm.goalkeeper;
                            const isCaptain = id === lineupForm.captain;

                            // Compute row divider for non-GK players
                            let rowDivider: string | null = null;
                            if (!isGK) {
                              const boundaryIdx = boundaries.indexOf(nonGkIdx);
                              if (boundaryIdx !== -1) rowDivider = rowLabels[boundaryIdx] ?? null;
                              nonGkIdx++;
                            }

                            return (
                              <div key={id}>
                                {rowDivider && (
                                  <div className="px-3 py-1 bg-gray-50 text-[9px] font-bold tracking-widest uppercase text-gray-400 border-t border-gray-200">
                                    {rowDivider}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 px-3 py-2">
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => moveStarter(i, -1)}
                                      disabled={i === 0}
                                      className="text-gray-400 hover:text-black disabled:opacity-20 leading-none text-[10px]"
                                      title="Flyt op"
                                    >▲</button>
                                    <button
                                      type="button"
                                      onClick={() => moveStarter(i, 1)}
                                      disabled={i === lineupForm.starters.length - 1}
                                      className="text-gray-400 hover:text-black disabled:opacity-20 leading-none text-[10px]"
                                      title="Flyt ned"
                                    >▼</button>
                                  </div>
                                  <span className="text-xs flex-1">
                                    <span className="font-bold">#{player.number}</span> {player.name}
                                    {isGK && <span className="ml-1 text-[9px] font-bold text-amber-600 uppercase">MV</span>}
                                    {isCaptain && <span className="ml-1 text-[9px] font-bold text-gray-500 uppercase">K</span>}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => togglePlayer(id, "starters")}
                                    className="text-gray-300 hover:text-red-500 text-xs leading-none"
                                    title="Fjern"
                                  >✕</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Add players */}
                        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Tilføj til startopstilling</p>
                        <div className="flex flex-wrap gap-1">
                          {players
                            .filter((p) => !lineupForm.starters.includes(p.id) && !lineupForm.bench.includes(p.id))
                            .map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => togglePlayer(p.id, "starters")}
                                className="text-[10px] border border-gray-200 px-2 py-1 hover:border-black hover:bg-gray-50"
                              >
                                #{p.number} {p.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Bench */}
                <div className="mb-4">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Bænk</p>
                  <div className="border border-gray-200 max-h-40 overflow-auto divide-y divide-gray-100">
                    {players
                      .filter((p) => !lineupForm.starters.includes(p.id))
                      .map((p) => (
                        <label key={`b-${p.id}`} className="flex items-center gap-2 px-3 py-2 text-xs">
                          <input type="checkbox" checked={lineupForm.bench.includes(p.id)} onChange={() => togglePlayer(p.id, "bench")} />
                          <span>#{p.number} {p.name}</span>
                        </label>
                      ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <select value={lineupForm.captain} onChange={(e) => setLineupForm({ ...lineupForm, captain: e.target.value })} className={`${inputCls} bg-white`}>
                    <option value="">Vælg kaptajn</option>
                    {[...lineupForm.starters, ...lineupForm.bench].map((id) => {
                      const player = players.find((p) => p.id === id);
                      return player ? <option key={`c-${id}`} value={id}>#{player.number} {player.name}</option> : null;
                    })}
                  </select>

                  <select value={lineupForm.goalkeeper} onChange={(e) => setLineupForm({ ...lineupForm, goalkeeper: e.target.value })} className={`${inputCls} bg-white`}>
                    <option value="">Vælg målmand</option>
                    {[...lineupForm.starters, ...lineupForm.bench].map((id) => {
                      const player = players.find((p) => p.id === id);
                      return player ? <option key={`g-${id}`} value={id}>#{player.number} {player.name}</option> : null;
                    })}
                  </select>
                </div>

                <button type="submit" disabled={savingLineup} className="bg-black text-white text-[10px] font-bold tracking-widest uppercase px-4 py-2.5 disabled:opacity-50">
                  {savingLineup ? "Gemmer..." : "Gem lineup"}
                </button>
                {lineup && <p className="text-[10px] text-gray-400 mt-2">Sidst opdateret: {new Date(lineup.updated_at).toLocaleString("da-DK")}</p>}
              </form>

              {/* Live pitch preview */}
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Forhåndsvisning</p>
                {lineupForm.starters.length > 0 ? (
                  <LineupPitch
                    starters={buildLineupSlots(lineupForm.starters)}
                    bench={buildLineupSlots(lineupForm.bench)}
                    formation={lineupForm.formation || null}
                    confirmed={lineupForm.confirmed}
                  />
                ) : (
                  <div className="border border-gray-200 p-6 text-xs text-gray-400 text-center">
                    Tilføj spillere for at se opstillingen
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
