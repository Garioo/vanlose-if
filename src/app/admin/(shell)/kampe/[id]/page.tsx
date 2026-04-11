"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Match, MatchEvent, MatchLineup, Player, LineupPlayerSlot } from "@/lib/supabase";
import { isVanlose } from "@/lib/match-result";
import { sortPlayersByNumber } from "@/lib/playerSort";
import { use } from "react";

const EVENT_LABELS: Record<MatchEvent["event_type"], string> = {
  goal: "Mål",
  own_goal: "Selvmål",
  penalty: "Straffespark",
  yellow_card: "Gult kort",
  red_card: "Rødt kort",
  substitution: "Udskiftning",
  kickoff: "Kickoff",
  halftime: "Pause",
  fulltime: "Slutfløjt",
};

const EVENT_TYPES: MatchEvent["event_type"][] = [
  "goal", "own_goal", "penalty", "yellow_card", "red_card", "substitution", "kickoff", "halftime", "fulltime",
];

const POSITIONS: Player["position"][] = ["MÅLMÆND", "FORSVAR", "MIDTBANE", "ANGREB"];

function createEmptyEventForm(): EventFormState {
  return {
    team_side: "home",
    event_type: "goal",
    minute: "",
    stoppage_minute: "",
    player_name: "",
    assist_name: "",
    note: "",
  };
}

interface EventFormState {
  team_side: "home" | "away";
  event_type: MatchEvent["event_type"];
  minute: string;
  stoppage_minute: string;
  player_name: string;
  assist_name: string;
  note: string;
}

interface LineupFormState {
  formation: string;
  confirmed: boolean;
  starters: string[]; // player IDs for VIF side, names for other
  bench: string[];
  captain: string;
  goalkeeper: string;
}

function createEmptyLineupForm(): LineupFormState {
  return { formation: "4-3-3", confirmed: false, starters: [], bench: [], captain: "", goalkeeper: "" };
}

function parseApiError(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const err = (payload as { error?: unknown }).error;
    if (typeof err === "string" && err.trim().length > 0) return err;
  }
  return fallback;
}

function toNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function statusLabel(status: Match["status"]) {
  if (status === "live") return "LIVE";
  if (status === "finished") return "SLUT";
  return "KOMMENDE";
}

function eventDotClass(type: MatchEvent["event_type"]) {
  if (type === "goal" || type === "penalty") return "bg-red-600";
  if (type === "own_goal") return "bg-gray-500";
  if (type === "yellow_card") return "bg-yellow-400";
  if (type === "red_card") return "bg-red-700";
  if (type === "substitution") return "bg-blue-500";
  return "bg-gray-300";
}

export default function MatchEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [homeLineup, setHomeLineup] = useState<MatchLineup | null>(null);
  const [awayLineup, setAwayLineup] = useState<MatchLineup | null>(null);

  const [tab, setTab] = useState<"events" | "lineup">("events");
  const [lineupSide, setLineupSide] = useState<"home" | "away">("home");

  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<EventFormState>(createEmptyEventForm);
  const [homeLineupForm, setHomeLineupForm] = useState<LineupFormState>(createEmptyLineupForm);
  const [awayLineupForm, setAwayLineupForm] = useState<LineupFormState>(createEmptyLineupForm);

  const [savingEvent, setSavingEvent] = useState(false);
  const [savingLineup, setSavingLineup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventSuccess, setEventSuccess] = useState(false);

  const vanloseSide = match ? (isVanlose(match.home) ? "home" : "away") : "home";

  const lineupFormFor = (side: "home" | "away") => (side === "home" ? homeLineupForm : awayLineupForm);
  const setLineupFormFor = (side: "home" | "away") => (side === "home" ? setHomeLineupForm : setAwayLineupForm);

  const playersByPosition = POSITIONS.map((pos) => ({
    pos,
    list: players.filter((p) => p.position === pos),
  })).filter((g) => g.list.length > 0);

  function populateVifLineupForm(lineup: MatchLineup | null, setForm: (f: LineupFormState) => void) {
    if (!lineup) { setForm(createEmptyLineupForm()); return; }
    const byName = new Map(players.map((p) => [p.name.trim().toLowerCase(), p.id]));
    const starterIds = (lineup.starters ?? [])
      .map((s) => byName.get(s.name.trim().toLowerCase()))
      .filter((id): id is string => Boolean(id));
    const benchIds = (lineup.bench ?? [])
      .map((s) => byName.get(s.name.trim().toLowerCase()))
      .filter((id): id is string => Boolean(id));
    const captainSlot = [...(lineup.starters ?? []), ...(lineup.bench ?? [])].find((s) => s.captain);
    const goalkeeperSlot = [...(lineup.starters ?? []), ...(lineup.bench ?? [])].find((s) => s.goalkeeper);
    setForm({
      formation: lineup.formation ?? "4-3-3",
      confirmed: Boolean(lineup.confirmed),
      starters: starterIds,
      bench: benchIds,
      captain: captainSlot ? byName.get(captainSlot.name.trim().toLowerCase()) ?? "" : "",
      goalkeeper: goalkeeperSlot ? byName.get(goalkeeperSlot.name.trim().toLowerCase()) ?? "" : "",
    });
  }

  function populateOpponentLineupForm(lineup: MatchLineup | null, setForm: (f: LineupFormState) => void) {
    if (!lineup) { setForm(createEmptyLineupForm()); return; }
    setForm({
      formation: lineup.formation ?? "4-3-3",
      confirmed: Boolean(lineup.confirmed),
      starters: (lineup.starters ?? []).map((s) => s.name),
      bench: (lineup.bench ?? []).map((s) => s.name),
      captain: "",
      goalkeeper: "",
    });
  }

  const loadData = useCallback(async () => {
    const [matchRes, eventsRes, playersRes, homeLineupRes, awayLineupRes] = await Promise.all([
      fetch(`/api/matches/${id}`),
      fetch(`/api/matches/${id}/events`),
      fetch("/api/players"),
      fetch(`/api/matches/${id}/lineup?team_side=home`),
      fetch(`/api/matches/${id}/lineup?team_side=away`),
    ]);

    const [matchData, eventsData, playersData, homeData, awayData] = await Promise.all([
      matchRes.json().catch(() => null),
      eventsRes.json().catch(() => []),
      playersRes.json().catch(() => []),
      homeLineupRes.json().catch(() => null),
      awayLineupRes.json().catch(() => null),
    ]);

    const nextMatch = matchData && typeof matchData === "object" && "id" in matchData ? (matchData as Match) : null;
    const nextPlayers: Player[] = Array.isArray(playersData) ? sortPlayersByNumber(playersData as Player[], "asc") : [];
    const nextHome: MatchLineup | null = homeData && typeof homeData === "object" && "id" in homeData ? (homeData as MatchLineup) : null;
    const nextAway: MatchLineup | null = awayData && typeof awayData === "object" && "id" in awayData ? (awayData as MatchLineup) : null;

    setMatch(nextMatch);
    setEvents(Array.isArray(eventsData) ? (eventsData as MatchEvent[]) : []);
    setPlayers(nextPlayers);
    setHomeLineup(nextHome);
    setAwayLineup(nextAway);
  }, [id]);

  useEffect(() => { void loadData(); }, [loadData]);

  // Populate lineup forms once players + lineups are loaded
  useEffect(() => {
    if (players.length === 0 || !match) return;
    if (vanloseSide === "home") {
      populateVifLineupForm(homeLineup, setHomeLineupForm);
    } else {
      populateOpponentLineupForm(homeLineup, setHomeLineupForm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeLineup, players, match]);

  useEffect(() => {
    if (players.length === 0 || !match) return;
    if (vanloseSide === "away") {
      populateVifLineupForm(awayLineup, setAwayLineupForm);
    } else {
      populateOpponentLineupForm(awayLineup, setAwayLineupForm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awayLineup, players, match]);

  // ---- Event handlers ----

  function startEditEvent(event: MatchEvent) {
    setEditingEventId(event.id);
    setError(null);
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
    if (!match) return;
    setSavingEvent(true);
    setError(null);
    setEventSuccess(false);

    const payload = {
      ...eventForm,
      minute: toNumber(eventForm.minute),
      stoppage_minute: toNumber(eventForm.stoppage_minute),
      player_name: eventForm.player_name.trim() || null,
      assist_name: eventForm.assist_name.trim() || null,
      note: eventForm.note.trim() || null,
    };

    const url = editingEventId
      ? `/api/admin/matches/${match.id}/events/${editingEventId}`
      : `/api/admin/matches/${match.id}/events`;
    const method = editingEventId ? "PUT" : "POST";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    setSavingEvent(false);

    if (!res.ok) { setError(parseApiError(data, "Kunne ikke gemme begivenhed.")); return; }

    setEventForm(createEmptyEventForm());
    setEditingEventId(null);
    setEventSuccess(true);
    setTimeout(() => setEventSuccess(false), 2000);
    await loadData();
  }

  async function deleteEvent(eventId: string) {
    if (!match || !confirm("Slet denne begivenhed?")) return;
    const res = await fetch(`/api/admin/matches/${match.id}/events/${eventId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(parseApiError(data, "Kunne ikke slette begivenhed."));
      return;
    }
    await loadData();
  }

  function buildLineupSlots(playerIds: string[], form: LineupFormState): LineupPlayerSlot[] {
    return playerIds
      .map((id) => players.find((p) => p.id === id))
      .filter((p): p is Player => Boolean(p))
      .map((p) => ({
        name: p.name,
        number: p.number,
        position: p.position,
        captain: form.captain === p.id,
        goalkeeper: form.goalkeeper === p.id,
      }));
  }

  function togglePlayerInList(
    playerId: string,
    field: "starters" | "bench",
    setForm: React.Dispatch<React.SetStateAction<LineupFormState>>
  ) {
    setForm((prev) => {
      const set = new Set(prev[field]);
      if (set.has(playerId)) { set.delete(playerId); } else { set.add(playerId); }
      return { ...prev, [field]: Array.from(set) };
    });
  }

  function buildOpponentSlots(names: string[]): LineupPlayerSlot[] {
    return names.map((name) => ({ name: name.trim() })).filter((s) => s.name.length > 0);
  }

  async function submitLineup(side: "home" | "away", e: React.FormEvent) {
    e.preventDefault();
    if (!match) return;
    const form = lineupFormFor(side);
    const isVIF = side === vanloseSide;

    if (isVIF) {
      const duplicate = form.starters.some((id) => form.bench.includes(id));
      if (duplicate) { setError("Samme spiller kan ikke være i både startopstilling og bænken."); return; }
    }

    setSavingLineup(true);
    setError(null);

    const starters = isVIF
      ? buildLineupSlots(form.starters.filter(Boolean), form)
      : buildOpponentSlots(form.starters);
    const bench = isVIF
      ? buildLineupSlots(form.bench.filter(Boolean), form)
      : buildOpponentSlots(form.bench);

    const payload = {
      team_side: side,
      formation: form.formation || null,
      confirmed: form.confirmed,
      starters,
      bench,
    };

    const res = await fetch(`/api/admin/matches/${match.id}/lineup`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setSavingLineup(false);

    if (!res.ok) { setError(parseApiError(data, "Kunne ikke gemme opstilling.")); return; }
    await loadData();
  }

  // ---- Shared styles ----
  const inputCls = "w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors bg-white";
  const labelCls = "block text-[10px] font-bold tracking-widest uppercase mb-1 text-gray-600";
  const tabBtn = (active: boolean) =>
    `px-5 py-2.5 text-[10px] font-bold tracking-widest uppercase border-b-2 transition-colors ${
      active ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"
    }`;

  // ---- Render ----
  if (!match) {
    return (
      <div>
        <div className="mb-8">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Admin</p>
          <h1 className="font-display text-3xl">Henter kamp…</h1>
        </div>
      </div>
    );
  }

  const currentLineupForm = lineupFormFor(lineupSide);
  const setCurrentLineupForm = setLineupFormFor(lineupSide);
  const isVanloseLine = lineupSide === vanloseSide;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Admin / Kampe</p>
          <h1 className="font-display text-3xl">{match.home} – {match.away}</h1>
          <p className="text-xs text-gray-500 mt-1">
            {match.date}{match.time ? ` kl. ${match.time}` : ""} ·{" "}
            <span className={match.status === "live" ? "text-red-600 font-bold" : ""}>{statusLabel(match.status)}</span>
            {match.home_score != null && match.away_score != null && (
              <> · {match.home_score} – {match.away_score}</>
            )}
          </p>
        </div>
        <Link
          href="/admin/kampe"
          className="text-[10px] font-bold tracking-widest uppercase border border-gray-300 px-4 py-2.5 hover:border-black transition-colors shrink-0"
        >
          ← Alle kampe
        </Link>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-600">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button type="button" onClick={() => setTab("events")} className={tabBtn(tab === "events")}>
          Begivenheder ({events.length})
        </button>
        <button type="button" onClick={() => setTab("lineup")} className={tabBtn(tab === "lineup")}>
          Opstilling
        </button>
      </div>

      {/* ---- EVENTS TAB ---- */}
      {tab === "events" && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_22rem] gap-6">
          {/* Events list */}
          <div>
            <p className={labelCls}>Registrerede begivenheder</p>
            {events.length === 0 ? (
              <div className="bg-white border border-gray-200 px-6 py-10 text-center text-xs text-gray-400">
                Ingen begivenheder registreret endnu.
              </div>
            ) : (
              <div className="bg-white border border-gray-200 divide-y divide-gray-100">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 px-4 py-3">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${eventDotClass(event.event_type)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800">
                        {event.minute != null ? `${event.minute}${event.stoppage_minute != null ? `+${event.stoppage_minute}` : ""}'` : "—"}{" "}
                        {EVENT_LABELS[event.event_type]}
                        {event.player_name && <> · {event.player_name}</>}
                        {event.assist_name && <> (assist: {event.assist_name})</>}
                      </p>
                      <p className="text-[9px] uppercase tracking-widest text-gray-400">
                        {event.team_side === "home" ? match.home : match.away}
                        {event.note && ` · ${event.note}`}
                      </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditEvent(event)}
                        className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                      >
                        Rediger
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteEvent(event.id)}
                        className="text-[9px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                      >
                        Slet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Event form */}
          <div>
            <p className={labelCls}>{editingEventId ? "Rediger begivenhed" : "Tilføj begivenhed"}</p>
            <form onSubmit={(e) => void submitEvent(e)} className="bg-white border border-gray-200 p-5 space-y-4">
              <div>
                <label className={labelCls}>Hold</label>
                <div className="flex">
                  {(["home", "away"] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setEventForm((f) => ({ ...f, team_side: side }))}
                      className={`flex-1 px-3 py-2 text-[10px] font-bold tracking-widest uppercase border transition-colors ${
                        eventForm.team_side === side
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-600 border-gray-300 hover:border-black"
                      } ${side === "away" ? "-ml-px" : ""}`}
                    >
                      {side === "home" ? match.home : match.away}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Begivenhed</label>
                <select
                  value={eventForm.event_type}
                  onChange={(e) => setEventForm((f) => ({ ...f, event_type: e.target.value as MatchEvent["event_type"] }))}
                  className={inputCls}
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>{EVENT_LABELS[type]}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Minut</label>
                  <input
                    type="number"
                    min={0}
                    max={130}
                    value={eventForm.minute}
                    onChange={(e) => setEventForm((f) => ({ ...f, minute: e.target.value }))}
                    placeholder="fx 45"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Tillægstid</label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={eventForm.stoppage_minute}
                    onChange={(e) => setEventForm((f) => ({ ...f, stoppage_minute: e.target.value }))}
                    placeholder="fx 2"
                    className={inputCls}
                  />
                </div>
              </div>

              {!["kickoff", "halftime", "fulltime"].includes(eventForm.event_type) && (
                <div>
                  <label className={labelCls}>
                    {eventForm.event_type === "substitution" ? "Spiller ind" : (eventForm.event_type === "goal" || eventForm.event_type === "penalty") ? "Målscorer" : "Spiller"}
                  </label>
                  <input
                    type="text"
                    value={eventForm.player_name}
                    onChange={(e) => setEventForm((f) => ({ ...f, player_name: e.target.value }))}
                    placeholder="Spillerens navn"
                    className={inputCls}
                  />
                </div>
              )}

              {(eventForm.event_type === "goal" || eventForm.event_type === "penalty" || eventForm.event_type === "substitution") && (
                <div>
                  <label className={labelCls}>
                    {eventForm.event_type === "substitution" ? "Spiller ud" : "Assist (valgfri)"}
                  </label>
                  <input
                    type="text"
                    value={eventForm.assist_name}
                    onChange={(e) => setEventForm((f) => ({ ...f, assist_name: e.target.value }))}
                    placeholder={eventForm.event_type === "substitution" ? "Spillerens navn" : "Assisterende spiller"}
                    className={inputCls}
                  />
                </div>
              )}

              <div>
                <label className={labelCls}>Note</label>
                <input
                  type="text"
                  value={eventForm.note}
                  onChange={(e) => setEventForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Valgfri note"
                  className={inputCls}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingEvent}
                  className="text-[10px] font-bold tracking-widest uppercase bg-black text-white px-5 py-2.5 hover:bg-gray-900 disabled:bg-gray-300 transition-colors"
                >
                  {savingEvent ? "Gemmer…" : editingEventId ? "Gem ændringer" : "Tilføj"}
                </button>
                {editingEventId && (
                  <button
                    type="button"
                    onClick={() => { setEditingEventId(null); setEventForm(createEmptyEventForm()); setError(null); }}
                    className="text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-black transition-colors"
                  >
                    Annuller
                  </button>
                )}
                {eventSuccess && (
                  <span className="text-[10px] font-bold tracking-widest uppercase text-green-600">Gemt!</span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- LINEUP TAB ---- */}
      {tab === "lineup" && (
        <div>
          {/* Side toggle */}
          <div className="flex mb-6">
            {(["home", "away"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setLineupSide(side)}
                className={`flex-1 px-4 py-3 text-[10px] font-bold tracking-widest uppercase border transition-colors ${
                  lineupSide === side
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-500 border-gray-300 hover:border-black"
                } ${side === "away" ? "-ml-px" : ""}`}
              >
                {side === "home" ? match.home : match.away}
                {(side === "home" ? homeLineup : awayLineup) && (
                  <span className="ml-2 text-[8px] opacity-70">Gemt</span>
                )}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => void submitLineup(lineupSide, e)}>
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_16rem] gap-6">
              {/* Player selection */}
              <div className="space-y-6">
                {isVanloseLine ? (
                  <>
                    {/* Roster-based picker for VIF side */}
                    {playersByPosition.map(({ pos, list }) => (
                      <div key={pos}>
                        <p className={labelCls}>{pos}</p>
                        <div className="bg-white border border-gray-200 divide-y divide-gray-100">
                          {list.map((player) => {
                            const inStarters = currentLineupForm.starters.includes(player.id);
                            const inBench = currentLineupForm.bench.includes(player.id);
                            return (
                              <div key={player.id} className="flex items-center gap-3 px-4 py-2.5">
                                <span className="text-[10px] font-bold text-gray-400 w-6 shrink-0">
                                  {player.number ? `#${player.number}` : ""}
                                </span>
                                <span className="text-xs font-bold text-gray-800 flex-1">{player.name}</span>
                                <label className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-500 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={inStarters}
                                    onChange={() => togglePlayerInList(player.id, "starters", setCurrentLineupForm)}
                                  />
                                  Start
                                </label>
                                <label className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-500 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={inBench}
                                    onChange={() => togglePlayerInList(player.id, "bench", setCurrentLineupForm)}
                                  />
                                  Bænk
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  /* Free-text for opponent */
                  <div className="space-y-4">
                    <div>
                      <p className={labelCls}>Startopstilling (ét navn per linje)</p>
                      <textarea
                        rows={11}
                        className={`${inputCls} resize-none font-mono text-xs`}
                        placeholder={"Spiller 1\nSpiller 2\n…"}
                        value={currentLineupForm.starters.join("\n")}
                        onChange={(e) =>
                          setCurrentLineupForm((f) => ({
                            ...f,
                            starters: e.target.value.split("\n"),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <p className={labelCls}>Bænk (ét navn per linje)</p>
                      <textarea
                        rows={5}
                        className={`${inputCls} resize-none font-mono text-xs`}
                        placeholder={"Indskifter 1\nIndskifter 2\n…"}
                        value={currentLineupForm.bench.join("\n")}
                        onChange={(e) =>
                          setCurrentLineupForm((f) => ({
                            ...f,
                            bench: e.target.value.split("\n"),
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Formation + captain/GK + save */}
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 p-4 space-y-4">
                  <div>
                    <label className={labelCls}>Formation</label>
                    <input
                      type="text"
                      value={currentLineupForm.formation}
                      onChange={(e) => setCurrentLineupForm((f) => ({ ...f, formation: e.target.value }))}
                      placeholder="fx 4-3-3"
                      className={inputCls}
                    />
                  </div>

                  {isVanloseLine && (
                    <>
                      <div>
                        <label className={labelCls}>Anfører</label>
                        <select
                          value={currentLineupForm.captain}
                          onChange={(e) => setCurrentLineupForm((f) => ({ ...f, captain: e.target.value }))}
                          className={inputCls}
                        >
                          <option value="">— Ingen —</option>
                          {[...currentLineupForm.starters, ...currentLineupForm.bench]
                            .map((pid) => players.find((p) => p.id === pid))
                            .filter((p): p is Player => Boolean(p))
                            .map((p) => (
                              <option key={p.id} value={p.id}>{p.number ? `#${p.number} ` : ""}{p.name}</option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Målmand</label>
                        <select
                          value={currentLineupForm.goalkeeper}
                          onChange={(e) => setCurrentLineupForm((f) => ({ ...f, goalkeeper: e.target.value }))}
                          className={inputCls}
                        >
                          <option value="">— Ingen —</option>
                          {[...currentLineupForm.starters, ...currentLineupForm.bench]
                            .map((pid) => players.find((p) => p.id === pid))
                            .filter((p): p is Player => Boolean(p))
                            .map((p) => (
                              <option key={p.id} value={p.id}>{p.number ? `#${p.number} ` : ""}{p.name}</option>
                            ))}
                        </select>
                      </div>
                    </>
                  )}

                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentLineupForm.confirmed}
                      onChange={(e) => setCurrentLineupForm((f) => ({ ...f, confirmed: e.target.checked }))}
                    />
                    Bekræftet opstilling
                  </label>
                </div>

                <div>
                  <p className={labelCls}>Startopstilling ({currentLineupForm.starters.filter(Boolean).length} spillere)</p>
                  {currentLineupForm.starters.filter(Boolean).length === 0 ? (
                    <p className="text-[9px] text-gray-300">Ingen valgt</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {currentLineupForm.starters
                        .filter(Boolean)
                        .map((id) => {
                          const p = players.find((pl) => pl.id === id);
                          const name = p?.name ?? id;
                          const isCap = currentLineupForm.captain === id;
                          const isGK = currentLineupForm.goalkeeper === id;
                          return (
                            <li key={id} className="text-xs text-gray-700">
                              {name}
                              {isCap && <span className="ml-1 text-[8px] font-bold uppercase text-yellow-600">(C)</span>}
                              {isGK && <span className="ml-1 text-[8px] font-bold uppercase text-blue-600">(GK)</span>}
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </div>

                {currentLineupForm.bench.filter(Boolean).length > 0 && (
                  <div>
                    <p className={labelCls}>Bænk ({currentLineupForm.bench.filter(Boolean).length})</p>
                    <ul className="space-y-0.5">
                      {currentLineupForm.bench.filter(Boolean).map((id) => {
                        const p = players.find((pl) => pl.id === id);
                        return <li key={id} className="text-xs text-gray-500">{p?.name ?? id}</li>;
                      })}
                    </ul>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingLineup}
                  className="w-full text-[10px] font-bold tracking-widest uppercase bg-black text-white px-5 py-2.5 hover:bg-gray-900 disabled:bg-gray-300 transition-colors"
                >
                  {savingLineup ? "Gemmer…" : "Gem opstilling"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
