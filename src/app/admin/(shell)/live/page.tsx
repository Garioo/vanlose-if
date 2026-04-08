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

const EVENT_LABELS: Record<MatchEvent["event_type"], string> = {
  goal:         "Mål",
  yellow_card:  "Gult kort",
  red_card:     "Rødt kort",
  substitution: "Udskiftning",
  kickoff:      "Kickoff",
  halftime:     "Pause",
  fulltime:     "Slutfløjt",
};

function formatEventType(t: MatchEvent["event_type"]): string {
  return EVENT_LABELS[t] ?? t.replace(/_/g, " ");
}

function nextExpectedAction(match: Match): string | null {
  if (match.status === "finished") return null;
  if (match.status === "scheduled" || match.live_phase === "pre_match" || !match.live_phase) return "start";
  if (match.live_phase === "first_half" && match.live_clock_running) return "pause";
  if (match.live_phase === "first_half" && !match.live_clock_running) return "resume_second_half";
  if (match.live_phase === "second_half") return "finish";
  return null;
}

function eventDotColor(type: MatchEvent["event_type"]): string {
  if (type === "goal") return "bg-red-600";
  if (type === "yellow_card") return "bg-yellow-400";
  if (type === "red_card") return "bg-red-600";
  if (type === "substitution") return "bg-blue-500";
  return "bg-gray-300";
}

function TeamToggle({
  value,
  onChange,
  homeLabel,
  awayLabel,
}: {
  value: "home" | "away";
  onChange: (v: "home" | "away") => void;
  homeLabel: string;
  awayLabel: string;
}) {
  const cls = (active: boolean) =>
    `flex-1 px-3 py-2 text-[10px] font-bold tracking-widest uppercase border transition-colors ${
      active ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-300 hover:border-black"
    }`;
  return (
    <div className="flex">
      <button type="button" onClick={() => onChange("home")} className={cls(value === "home")}>
        {homeLabel}
      </button>
      <button type="button" onClick={() => onChange("away")} className={`${cls(value === "away")} -ml-px`}>
        {awayLabel}
      </button>
    </div>
  );
}

function PlayerField({
  label,
  value,
  onChange,
  isVanloseSide,
  lineupPlayers,
  allPlayers,
  placeholder,
  inputCls,
  labelCls,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  isVanloseSide: boolean;
  lineupPlayers: LineupPlayerSlot[];
  allPlayers: Player[];
  placeholder: string;
  inputCls: string;
  labelCls: string;
}) {
  const options =
    isVanloseSide && lineupPlayers.length > 0
      ? lineupPlayers.map((p) => ({ key: p.name, value: p.name, label: `${p.number ? `#${p.number} ` : ""}${p.name}` }))
      : isVanloseSide && allPlayers.length > 0
      ? allPlayers.map((p) => ({ key: p.id, value: p.name, label: `${p.number ? `#${p.number} ` : ""}${p.name}` }))
      : null;

  if (options) {
    return (
      <div>
        <label className={labelCls}>{label}</label>
        <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} bg-white`}>
          <option value="">— {placeholder} —</option>
          {options.map((o) => (
            <option key={o.key} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div>
      <label className={labelCls}>{label} (fritekst)</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </div>
  );
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
    setTimeout(() => {
      document.getElementById("event-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
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
    setQuickPlayerName("");
    setQuickAssistName("");
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

  function setSlotPlayer(slotIdx: number, playerId: string, totalSlots: number) {
    setLineupForm((f) => {
      const slots = Array.from({ length: totalSlots }, (_, i) => f.starters[i] ?? "");
      if (playerId) {
        const oldIdx = slots.indexOf(playerId);
        if (oldIdx !== -1 && oldIdx !== slotIdx) slots[oldIdx] = "";
      }
      slots[slotIdx] = playerId;
      return { ...f, starters: slots };
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
      starters: buildLineupSlots(lineupForm.starters.filter(Boolean)),
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
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-8">
          <div className="space-y-8">
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="text-xs font-bold tracking-widest uppercase mb-2">Live kontrol</h2>
              <p className="text-xs text-gray-500 mb-4">{selectedMatch.home} — {selectedMatch.away}</p>

              <div className="mb-4 p-4 border border-gray-200 bg-black text-white text-center">
                <p className="text-[10px] tracking-widest uppercase text-gray-300 mb-2">{selectedMatch.period_label || "Kampur"}</p>
                <p className="font-display text-5xl tabular-nums leading-none">{liveClock}</p>
                <p className="text-xs text-gray-300 mt-2">{liveMinute}&apos; · {parseStatusLabel(selectedMatch.status)}</p>
              </div>

              <div className="flex items-center gap-3 py-3 px-2 border border-gray-200 mb-3">
                <span className="flex-1 font-bold truncate text-[10px] uppercase tracking-widest">{selectedMatch.home}</span>
                <span className="font-display text-3xl tabular-nums leading-none shrink-0">
                  {selectedMatch.home_score ?? 0}–{selectedMatch.away_score ?? 0}
                </span>
                <span className="flex-1 text-right font-bold truncate text-[10px] uppercase tracking-widest">{selectedMatch.away}</span>
              </div>

              <button
                type="button"
                disabled={savingLive || selectedMatch.status === "finished"}
                onClick={() => void handlePlayPause()}
                className="w-full bg-black text-white text-sm font-bold tracking-widest uppercase px-4 py-3 disabled:opacity-50"
              >
                {savingLive ? "Arbejder..." : primaryLiveLabel}
              </button>

              {(() => {
                const nextAction = nextExpectedAction(selectedMatch);
                const phaseBtnCls = (action: string) =>
                  `border px-3 py-2 text-[10px] font-bold tracking-widest uppercase disabled:opacity-50 transition-colors ${
                    nextAction === action
                      ? "bg-black text-white border-black"
                      : "border-gray-300 hover:border-black"
                  }`;
                return (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <button type="button" disabled={savingLive} onClick={() => void sendLiveAction("start")} className={phaseBtnCls("start")}>Start kamp</button>
                    <button type="button" disabled={savingLive} onClick={() => void sendLiveAction("pause")} className={phaseBtnCls("pause")}>Pause (halvleg)</button>
                    <button type="button" disabled={savingLive} onClick={() => void sendLiveAction("resume_second_half")} className={phaseBtnCls("resume_second_half")}>Start 2. halvleg</button>
                    <button type="button" disabled={savingLive} onClick={() => void sendLiveAction("finish")} className={phaseBtnCls("finish")}>Afslut kamp</button>
                  </div>
                );
              })()}

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
              <h2 className="text-xs font-bold tracking-widest uppercase mb-4">Hændelse</h2>

              {/* Quick-add area */}
              {(() => {
                const lineupPlayers = [...(lineup?.starters ?? []), ...(lineup?.bench ?? [])];
                const vanloseSide = getVanloseSide(selectedMatch);
                const isVanloseSide = quickTeamSide === vanloseSide;
                const homeLabel = isVanlose(selectedMatch.home) ? "Hjemme (Vanløse)" : "Hjemme";
                const awayLabel = isVanlose(selectedMatch.home) ? "Ude" : "Ude (Vanløse)";
                return (
                  <div className="mb-5">
                    <div className="mb-3">
                      <TeamToggle value={quickTeamSide} onChange={setQuickTeamSide} homeLabel={homeLabel} awayLabel={awayLabel} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <PlayerField
                        label="Spiller"
                        value={quickPlayerName}
                        onChange={setQuickPlayerName}
                        isVanloseSide={isVanloseSide}
                        lineupPlayers={lineupPlayers}
                        allPlayers={players}
                        placeholder="Spiller"
                        inputCls={inputCls}
                        labelCls={labelCls}
                      />
                      <PlayerField
                        label="Assist / Ud"
                        value={quickAssistName}
                        onChange={setQuickAssistName}
                        isVanloseSide={isVanloseSide}
                        lineupPlayers={lineupPlayers}
                        allPlayers={players}
                        placeholder="Assist"
                        inputCls={inputCls}
                        labelCls={labelCls}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" disabled={savingEvent} onClick={() => void createQuickEvent("goal")}
                        className="col-span-2 bg-black text-white text-sm font-bold tracking-widest uppercase px-3 py-4 disabled:opacity-50 hover:bg-gray-900 transition-colors">
                        {savingEvent ? "..." : `Mål — ${liveMinute}\u2019`}
                      </button>
                      <button type="button" disabled={savingEvent} onClick={() => void createQuickEvent("yellow_card")}
                        className="bg-yellow-400 text-black text-[11px] font-bold tracking-widest uppercase px-3 py-3 disabled:opacity-50">
                        Gult kort
                      </button>
                      <button type="button" disabled={savingEvent} onClick={() => void createQuickEvent("red_card")}
                        className="bg-red-600 text-white text-[11px] font-bold tracking-widest uppercase px-3 py-3 disabled:opacity-50">
                        Rødt kort
                      </button>
                      <button type="button" disabled={savingEvent} onClick={() => void createQuickEvent("substitution")}
                        className="col-span-2 bg-slate-700 text-white text-[11px] font-bold tracking-widest uppercase px-3 py-3 disabled:opacity-50">
                        Udskiftning
                      </button>
                    </div>
                    <input
                      value={quickNote}
                      onChange={(e) => setQuickNote(e.target.value)}
                      className={`${inputCls} mt-2`}
                      placeholder="Note (valgfri)..."
                    />
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button type="button" disabled={savingEvent} onClick={() => void createQuickEvent("kickoff")} className="flex-1 border border-gray-200 text-[10px] font-bold tracking-widest uppercase py-1.5 hover:border-black disabled:opacity-50">Kickoff</button>
                      <button type="button" disabled={savingEvent} onClick={() => void createQuickEvent("halftime")} className="flex-1 border border-gray-200 text-[10px] font-bold tracking-widest uppercase py-1.5 hover:border-black disabled:opacity-50">Pause</button>
                      <button type="button" disabled={savingEvent} onClick={() => void createQuickEvent("fulltime")} className="flex-1 border border-gray-200 text-[10px] font-bold tracking-widest uppercase py-1.5 hover:border-black disabled:opacity-50">Slutfløjt</button>
                    </div>
                  </div>
                );
              })()}

              {/* Edit form — only shown when editing an existing event */}
              {editingEventId && (() => {
                const editingEvent = events.find((e) => e.id === editingEventId);
                const lineupPlayers = [...(lineup?.starters ?? []), ...(lineup?.bench ?? [])];
                const isVanloseSide = eventForm.team_side === getVanloseSide(selectedMatch);
                const type = eventForm.event_type;
                const noPlayers = type === "kickoff" || type === "halftime" || type === "fulltime";
                const isSub = type === "substitution";
                const isCard = type === "yellow_card" || type === "red_card";
                return (
                  <form id="event-form" onSubmit={submitEvent} className="border border-yellow-300 bg-yellow-50 p-4 mb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-yellow-700">
                        Redigerer: {editingEvent ? `${formatEventType(editingEvent.event_type)}, ${editingEvent.minute ?? "?"}′` : "event"}
                      </span>
                      <button type="button" onClick={() => { setEditingEventId(null); setEventForm(createEmptyEventForm()); }}
                        className="text-[10px] font-bold uppercase text-yellow-700 hover:text-black">× Annullér</button>
                    </div>
                    <TeamToggle
                      value={eventForm.team_side}
                      onChange={(v) => setEventForm({ ...eventForm, team_side: v })}
                      homeLabel={isVanlose(selectedMatch.home) ? "Hjemme (Vanløse)" : "Hjemme"}
                      awayLabel={isVanlose(selectedMatch.home) ? "Ude" : "Ude (Vanløse)"}
                    />
                    <div>
                      <label className={labelCls}>Hændelse</label>
                      <select value={eventForm.event_type} onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value as MatchEvent["event_type"] })} className={`${inputCls} bg-white`}>
                        <option value="goal">Mål</option>
                        <option value="yellow_card">Gult kort</option>
                        <option value="red_card">Rødt kort</option>
                        <option value="substitution">Udskiftning</option>
                        <option value="kickoff">Kickoff</option>
                        <option value="halftime">Pause</option>
                        <option value="fulltime">Slut</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelCls}>Minut</label>
                        <input type="number" min="0" placeholder={String(liveMinute)} value={eventForm.minute} onChange={(e) => setEventForm({ ...eventForm, minute: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Tillæg</label>
                        <input type="number" min="0" placeholder="0" value={eventForm.stoppage_minute} onChange={(e) => setEventForm({ ...eventForm, stoppage_minute: e.target.value })} className={inputCls} />
                      </div>
                    </div>
                    {!noPlayers && (
                      <PlayerField
                        label={isSub ? "Spiller ind" : type === "goal" ? "Målscorer" : "Spiller"}
                        value={eventForm.player_name}
                        onChange={(v) => setEventForm({ ...eventForm, player_name: v })}
                        isVanloseSide={isVanloseSide}
                        lineupPlayers={lineupPlayers}
                        allPlayers={players}
                        placeholder="Vælg spiller"
                        inputCls={inputCls}
                        labelCls={labelCls}
                      />
                    )}
                    {!noPlayers && !isCard && (
                      <PlayerField
                        label={isSub ? "Spiller ud" : "Assist (valgfri)"}
                        value={eventForm.assist_name}
                        onChange={(v) => setEventForm({ ...eventForm, assist_name: v })}
                        isVanloseSide={isVanloseSide}
                        lineupPlayers={lineupPlayers}
                        allPlayers={players}
                        placeholder={isSub ? "Vælg spiller" : "Vælg assist"}
                        inputCls={inputCls}
                        labelCls={labelCls}
                      />
                    )}
                    <input type="text" placeholder="Note..." value={eventForm.note} onChange={(e) => setEventForm({ ...eventForm, note: e.target.value })} className={inputCls} />
                    <button type="submit" disabled={savingEvent} className="w-full bg-black text-white text-[10px] font-bold tracking-widest uppercase px-4 py-2.5 disabled:opacity-50">
                      {savingEvent ? "Gemmer..." : "Opdatér event"}
                    </button>
                  </form>
                );
              })()}

              {/* Events log */}
              <h3 className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Log</h3>
              <div className="border border-gray-200 divide-y divide-gray-100">
                {events.map((event) => (
                  <div key={event.id} className="px-3 py-2.5 flex items-start gap-3">
                    <div className="min-w-10 text-[10px] font-bold tracking-widest uppercase text-gray-400 pt-0.5">
                      {event.minute != null ? `${event.minute}${event.stoppage_minute ? `+${event.stoppage_minute}` : ""}'` : "—"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${eventDotColor(event.event_type)}`} />
                        <p className="text-xs font-bold uppercase tracking-wide">{formatEventType(event.event_type)}</p>
                      </div>
                      <p className="text-xs text-gray-600">{[event.player_name, event.assist_name ? (event.event_type === "substitution" ? `Ud: ${event.assist_name}` : `Assist: ${event.assist_name}`) : null, event.note].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
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

            <form onSubmit={submitLineup}>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <input type="text" value={lineupForm.formation} onChange={(e) => setLineupForm({ ...lineupForm, formation: e.target.value })} className={inputCls} placeholder="4-3-3" />
                <label className="inline-flex items-center gap-2 text-xs text-gray-600 border border-gray-300 px-3 py-2">
                  <input type="checkbox" checked={lineupForm.confirmed} onChange={(e) => setLineupForm({ ...lineupForm, confirmed: e.target.checked })} />
                  Bekræftet
                </label>
              </div>

              {/* Interactive pitch picker */}
              {(() => {
                const formRows = lineupForm.formation
                  .split("-").map((n) => parseInt(n, 10)).filter((n) => !isNaN(n) && n > 0);
                const totalSlots = 1 + formRows.reduce((s, n) => s + n, 0);
                const slots = Array.from({ length: totalSlots }, (_, i) => lineupForm.starters[i] ?? "");
                const assignedIds = new Set(slots.filter(Boolean));
                const filledCount = assignedIds.size;

                // Build slot rows: slot 0 = GK at bottom, outfield rows above
                const outfieldSlotRows: number[][] = [];
                let cursor = 1;
                for (const count of formRows) {
                  outfieldSlotRows.push(Array.from({ length: count }, (_, i) => cursor + i));
                  cursor += count;
                }
                const allSlotRows: number[][] = [...outfieldSlotRows.reverse(), [0]];

                const topY = 10, botY = 88;
                const positioned: Array<{ slotIdx: number; x: number; y: number }> = [];
                allSlotRows.forEach((row, rowIdx) => {
                  const y = allSlotRows.length === 1
                    ? (topY + botY) / 2
                    : topY + (rowIdx * (botY - topY)) / (allSlotRows.length - 1);
                  row.forEach((slotIdx, playerIdx) => {
                    const x = ((playerIdx + 1) * 100) / (row.length + 1);
                    positioned.push({ slotIdx, x, y });
                  });
                });

                const dotSize = 36;

                return (
                  <div className="mb-4">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">
                      Startopstilling: {filledCount}/{totalSlots} · Bænk: {lineupForm.bench.length}
                    </p>

                    {/* Pitch */}
                    <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", maxHeight: 320, overflow: "hidden", backgroundColor: "#3a7d44" }}>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${i * 12.5}%`, height: "12.5%", backgroundColor: i % 2 === 0 ? "rgba(0,0,0,0.07)" : "transparent", pointerEvents: "none" }} />
                      ))}
                      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 300 400" preserveAspectRatio="none" fill="none">
                        <rect x="10" y="10" width="280" height="380" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                        <line x1="10" y1="200" x2="290" y2="200" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                        <ellipse cx="150" cy="200" rx="38" ry="30" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                        <circle cx="150" cy="200" r="3" fill="rgba(255,255,255,0.6)" />
                        <rect x="80" y="10" width="140" height="66" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                        <rect x="115" y="10" width="70" height="24" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                        <rect x="80" y="324" width="140" height="66" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                        <rect x="115" y="366" width="70" height="24" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                        <circle cx="150" cy="55" r="2.5" fill="rgba(255,255,255,0.6)" />
                        <circle cx="150" cy="345" r="2.5" fill="rgba(255,255,255,0.6)" />
                      </svg>

                      {positioned.map(({ slotIdx, x, y }) => {
                        const currentId = slots[slotIdx] ?? "";
                        const player = currentId ? players.find((p) => p.id === currentId) : null;
                        const isGKSlot = slotIdx === 0;
                        const isCaptain = Boolean(currentId) && lineupForm.captain === currentId;
                        const isGKBadge = Boolean(currentId) && lineupForm.goalkeeper === currentId;

                        return (
                          <div key={slotIdx} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <div style={{ position: "relative", width: dotSize, height: dotSize }}>
                              <div style={{
                                width: dotSize, height: dotSize, borderRadius: "50%",
                                backgroundColor: player ? (isGKSlot || isGKBadge ? "#f59e0b" : "#fff") : "transparent",
                                border: player ? "none" : "2px dashed rgba(255,255,255,0.45)",
                                boxShadow: player ? "0 2px 6px rgba(0,0,0,0.45)" : "none",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: player ? "#111" : "rgba(255,255,255,0.5)",
                                fontWeight: 700, fontSize: 11,
                                userSelect: "none", pointerEvents: "none",
                              }}>
                                {player ? `#${player.number}` : "+"}
                              </div>
                              {player && isCaptain && (
                                <div style={{ position: "absolute", top: -3, right: -3, width: 13, height: 13, borderRadius: "50%", backgroundColor: "#111", color: "#fff", fontSize: 7, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>C</div>
                              )}
                              <select
                                value={currentId}
                                onChange={(e) => setSlotPlayer(slotIdx, e.target.value, totalSlots)}
                                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                                title={player ? `${player.name} — klik for at ændre` : "Vælg spiller"}
                              >
                                <option value="">— vælg —</option>
                                {player && <option value={currentId}>#{player.number} {player.name} ✓</option>}
                                {players.filter((p) => !assignedIds.has(p.id)).map((p) => (
                                  <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
                                ))}
                              </select>
                            </div>
                            {player && (
                              <div style={{ color: "#fff", fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap", textShadow: "0 1px 3px rgba(0,0,0,0.7)", lineHeight: 1.1 }}>
                                {player.name.trim().split(" ").pop()}
                              </div>
                            )}
                            {player && (
                              <div style={{ display: "flex", gap: 2, marginTop: 1 }}>
                                <button type="button"
                                  onClick={() => setLineupForm((f) => ({ ...f, captain: isCaptain ? "" : currentId }))}
                                  style={{ fontSize: 8, fontWeight: 700, padding: "1px 4px", border: `1px solid ${isCaptain ? "#111" : "rgba(255,255,255,0.4)"}`, backgroundColor: isCaptain ? "#111" : "transparent", color: isCaptain ? "#fff" : "rgba(255,255,255,0.7)", cursor: "pointer", borderRadius: 2, lineHeight: 1.4 }}
                                >K</button>
                                <button type="button"
                                  onClick={() => setLineupForm((f) => ({ ...f, goalkeeper: isGKBadge ? "" : currentId }))}
                                  style={{ fontSize: 8, fontWeight: 700, padding: "1px 4px", border: `1px solid ${isGKBadge ? "#f59e0b" : "rgba(255,255,255,0.4)"}`, backgroundColor: isGKBadge ? "#f59e0b" : "transparent", color: isGKBadge ? "#111" : "rgba(255,255,255,0.7)", cursor: "pointer", borderRadius: 2, lineHeight: 1.4 }}
                                >MV</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Bench */}
                    <div className="mt-3 mb-4">
                      <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-1">Bænk</p>
                      <div className="flex flex-wrap gap-1">
                        {players.filter((p) => !assignedIds.has(p.id)).map((p) => {
                          const onBench = lineupForm.bench.includes(p.id);
                          return (
                            <button key={p.id} type="button" onClick={() => togglePlayer(p.id, "bench")}
                              className={`text-[10px] font-bold uppercase px-2 py-1 border transition-colors ${onBench ? "bg-black text-white border-black" : "border-gray-200 text-gray-500 hover:border-black"}`}>
                              #{p.number} {p.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <button type="submit" disabled={savingLineup} className="bg-black text-white text-[10px] font-bold tracking-widest uppercase px-4 py-2.5 disabled:opacity-50">
                {savingLineup ? "Gemmer..." : "Gem lineup"}
              </button>
              {lineup && <p className="text-[10px] text-gray-400 mt-2">Sidst opdateret: {new Date(lineup.updated_at).toLocaleString("da-DK")}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
