"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Match, Team } from "@/lib/supabase";
import { formatClockSeconds, getLiveClockSeconds } from "@/lib/live-clock";
import { parseMatchTimestamp, sortMatchesByKickoff } from "@/lib/matchDate";

const emptyMatch = {
  date: "",
  time: "",
  home_team_id: "",
  away_team_id: "",
  venue: "Vanløse Idrætspark",
  is_upcoming: true,
  home_score: "",
  away_score: "",
  result: "",
  status: "scheduled" as Match["status"],
  gruppe: "regular",
};

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

function toDateInputValue(dateText: string, timeText?: string | null): string {
  const direct = dateText.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) {
    return direct;
  }

  const ts = parseMatchTimestamp(dateText, timeText);
  if (ts == null) return "";

  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTimeInputValue(timeText?: string | null): string {
  if (!timeText) return "";
  const normalized = timeText.trim().replace(".", ":");
  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return "";
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export default function AdminKampePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState(emptyMatch);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [matchFilter, setMatchFilter] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  const getHomeTurf = useCallback(
    (teamId: string) => teams.find((t) => t.id === teamId)?.home_turf?.trim() ?? "",
    [teams],
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

  const updateMatchState = useCallback((updated: Match) => {
    setMatches((prev) => {
      const next = prev.some((item) => item.id === updated.id)
        ? prev.map((item) => (item.id === updated.id ? updated : item))
        : [...prev, updated];
      return sortMatchesByKickoff(next, "desc");
    });
  }, []);

  const load = useCallback(async () => {
    const [matchesRes, teamsRes] = await Promise.all([
      fetch("/api/matches"),
      fetch("/api/teams"),
    ]);

    const [matchesData, teamsData] = await Promise.all([
      matchesRes.json().catch(() => []),
      teamsRes.json().catch(() => []),
    ]);

    const nextMatches = Array.isArray(matchesData)
      ? sortMatchesByKickoff(matchesData as Match[], "desc")
      : [];

    setMatches(nextMatches);
    setTeams(Array.isArray(teamsData) ? teamsData : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (editId || form.home_team_id || teams.length === 0) return;
    const vanlose = teams.find((t) => normalizeName(t.name) === "vanløse if");
    const initialTeam = vanlose ?? teams[0];
    if (!initialTeam) return;
    setForm((prev) => ({
      ...prev,
      home_team_id: initialTeam.id,
      venue: getHomeTurf(initialTeam.id) || prev.venue,
    }));
  }, [teams, editId, form.home_team_id, getHomeTurf]);

  function handleHomeTeamChange(homeTeamId: string) {
    setForm((prev) => {
      const previousAutoVenue = getHomeTurf(prev.home_team_id);
      const nextAutoVenue = getHomeTurf(homeTeamId);
      const shouldReplaceVenue = !prev.venue || prev.venue === previousAutoVenue || prev.venue === "Vanløse Idrætspark";

      return {
        ...prev,
        home_team_id: homeTeamId,
        venue: shouldReplaceVenue ? nextAutoVenue : prev.venue,
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      ...form,
      home_score: form.home_score !== "" ? Number(form.home_score) : null,
      away_score: form.away_score !== "" ? Number(form.away_score) : null,
      result: form.result || null,
      is_upcoming: form.status === "finished" ? false : form.is_upcoming,
    };

    const res = editId
      ? await fetch(`/api/matches/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(parseApiError(data, editId ? "Kunne ikke opdatere kamp." : "Kunne ikke oprette kamp."));
      return;
    }

    const saved = data as Match;
    setForm(emptyMatch);
    setEditId(null);
    updateMatchState(saved);
  }

  async function handleDelete(id: string) {
    if (!confirm("Slet kamp?")) return;
    const res = await fetch(`/api/matches/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(parseApiError(data, "Kunne ikke slette kamp."));
      return;
    }

    setMatches((prev) => prev.filter((m) => m.id !== id));
  }

  function startEdit(m: Match) {
    setEditId(m.id);
    const homeTeamId =
      m.home_team_id ?? teams.find((t) => normalizeName(t.name) === normalizeName(m.home))?.id ?? "";
    const awayTeamId =
      m.away_team_id ?? teams.find((t) => normalizeName(t.name) === normalizeName(m.away))?.id ?? "";

    setForm({
      date: toDateInputValue(m.date, m.time),
      time: toTimeInputValue(m.time),
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      venue: m.venue ?? "",
      is_upcoming: m.is_upcoming,
      home_score: m.home_score?.toString() ?? "",
      away_score: m.away_score?.toString() ?? "",
      result: m.result ?? "",
      status: m.status ?? "scheduled",
      gruppe: m.gruppe ?? "regular",
    });
  }

  const inputCls = "w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors";
  const labelCls = "block text-[10px] font-bold tracking-widest uppercase mb-1 text-gray-600";

  return (
    <div>
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Admin</p>
        <h1 className="font-display text-3xl">KAMPE & RESULTATER</h1>
      </div>


      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-xs font-bold tracking-widest uppercase mb-5">{editId ? "Redigér kamp" : "Tilføj kamp"}</h2>
        {error && <p className="mb-4 text-xs text-red-500">{error}</p>}

        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={labelCls}>Dato</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Tidspunkt</label>
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={inputCls} step={60} />
          </div>
          <div>
            <label className={labelCls}>Hjemmehold</label>
            <select value={form.home_team_id} onChange={(e) => handleHomeTeamChange(e.target.value)} className={inputCls} required>
              <option value="">Vælg hold</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Udehold</label>
            <select value={form.away_team_id} onChange={(e) => setForm({ ...form, away_team_id: e.target.value })} className={inputCls} required>
              <option value="">Vælg hold</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Bane</label>
            <input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Match["status"] })} className={`${inputCls} bg-white`}>
              <option value="scheduled">KOMMENDE</option>
              <option value="live">LIVE</option>
              <option value="finished">SLUT</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Kamp vises som</label>
            <select value={form.is_upcoming ? "1" : "0"} onChange={(e) => setForm({ ...form, is_upcoming: e.target.value === "1" })} className={`${inputCls} bg-white`}>
              <option value="1">Kommende</option>
              <option value="0">Spillet</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Gruppe</label>
            <select value={form.gruppe} onChange={(e) => setForm({ ...form, gruppe: e.target.value })} className={`${inputCls} bg-white`}>
              <option value="regular">Grundspil</option>
              <option value="oprykning">Oprykningsspil</option>
              <option value="nedrykning">Nedrykningsspil</option>
            </select>
          </div>

          {!form.is_upcoming && (
            <>
              <div>
                <label className={labelCls}>Hjemmemål</label>
                <input type="number" min="0" value={form.home_score} onChange={(e) => setForm({ ...form, home_score: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Udemål</label>
                <input type="number" min="0" value={form.away_score} onChange={(e) => setForm({ ...form, away_score: e.target.value })} className={inputCls} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Resultat (VIF)</label>
                <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} className={`${inputCls} bg-white`}>
                  <option value="">Vælg</option>
                  <option value="win">Sejr</option>
                  <option value="draw">Uafgjort</option>
                  <option value="loss">Tab</option>
                </select>
              </div>
            </>
          )}

          <div className="col-span-2 md:col-span-4 flex gap-2 pt-2">
            <button type="submit" className="text-xs font-bold tracking-widest uppercase bg-black text-white px-6 py-2.5 hover:bg-gray-900">
              {editId ? "GEM" : "TILFØJ"}
            </button>
            {editId && (
              <button type="button" onClick={() => { setEditId(null); setForm(emptyMatch); }} className="text-xs font-bold tracking-widest uppercase border border-gray-300 px-6 py-2.5 hover:border-black">
                Annullér
              </button>
            )}
            <p className="text-[9px] text-gray-400 self-center ml-auto">Tips: Opret hold under &quot;Hold&quot; menuen først.</p>
          </div>
        </form>
      </div>

      <div className="bg-white border border-gray-200 mb-8">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 space-y-3">
          <label className={labelCls}>Find kamp</label>
          <input
            type="text"
            value={matchFilter}
            onChange={(e) => setMatchFilter(e.target.value)}
            className={inputCls}
            placeholder="Søg på hold, bane eller dato..."
          />
        </div>
        <div className="hidden md:grid grid-cols-12 text-[9px] font-bold tracking-widest uppercase text-gray-400 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <span className="col-span-2">Dato</span>
          <span className="col-span-4">Kamp</span>
          <span className="col-span-2">Score</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2 text-right">Handlinger</span>
        </div>
        {filteredMatches.map((m) => (
          <div key={m.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
            {/* Mobile card */}
            <div className="md:hidden px-4 py-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase truncate">{m.home} — {m.away}</p>
                  <p className="text-[10px] text-gray-400">{formatMatchDateTime(m)}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase shrink-0 ${m.status === "live" ? "text-red-500" : m.status === "finished" ? "text-gray-500" : "text-blue-500"}`}>
                  {parseStatusLabel(m.status)}{m.status === "live" ? ` ${formatClockSeconds(getLiveClockSeconds(m, nowMs))}` : ""}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">{m.home_score != null ? `${m.home_score}–${m.away_score}` : "—"}</span>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/live?match=${m.id}`} className="text-[10px] font-bold tracking-widest uppercase text-blue-600 hover:text-blue-800">Live</Link>
                  <button onClick={() => startEdit(m)} className="text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-black">Redigér</button>
                  <button onClick={() => void handleDelete(m.id)} className="text-[10px] font-bold tracking-widest uppercase text-red-400 hover:text-red-600">Slet</button>
                </div>
              </div>
            </div>
            {/* Desktop row */}
            <div className="hidden md:grid grid-cols-12 items-center px-4 py-3">
              <span className="col-span-2 text-[10px] text-gray-400">{formatMatchDateTime(m)}</span>
              <div className="col-span-4">
                <p className="text-xs font-bold uppercase truncate">{m.home} — {m.away}</p>
                <p className="text-[10px] text-gray-400 truncate">
                  {m.venue || "Bane mangler"}
                  {m.gruppe && m.gruppe !== "regular" && (
                    <span className={`ml-2 inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase ${m.gruppe === "oprykning" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {m.gruppe === "oprykning" ? "Oprykning" : "Nedrykning"}
                    </span>
                  )}
                </p>
              </div>
              <span className="col-span-2 text-xs text-gray-600">{m.home_score != null ? `${m.home_score}–${m.away_score}` : "—"}</span>
              <span className={`col-span-2 text-[10px] font-bold uppercase ${m.status === "live" ? "text-red-500" : m.status === "finished" ? "text-gray-500" : "text-blue-500"}`}>
                {parseStatusLabel(m.status)}{m.status === "live" ? ` ${formatClockSeconds(getLiveClockSeconds(m, nowMs))}` : ""}
              </span>
              <div className="col-span-2 flex items-center justify-end gap-2">
                <Link href={`/admin/live?match=${m.id}`} className="text-[10px] font-bold tracking-widest uppercase text-blue-600 hover:text-blue-800">
                  Live
                </Link>
                <Link href={`/admin/kampe/${m.id}`} className="text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-black">
                  Begivenheder
                </Link>
                <button onClick={() => startEdit(m)} className="text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-black">Redigér</button>
                <button onClick={() => void handleDelete(m.id)} className="text-[10px] font-bold tracking-widest uppercase text-red-400 hover:text-red-600">Slet</button>
              </div>
            </div>
          </div>
        ))}
        {matches.length === 0 && <div className="px-4 py-8 text-center text-xs text-gray-400">Ingen kampe endnu.</div>}
        {matches.length > 0 && filteredMatches.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-gray-400">Ingen kampe matcher søgningen.</div>
        )}
      </div>
    </div>
  );
}
