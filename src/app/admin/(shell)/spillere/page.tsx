"use client";

import { useState, useEffect, useCallback } from "react";
import type { Player, PlayerStats } from "@/lib/supabase";
import { sortPlayersByNumber } from "@/lib/playerSort";
import MediaPicker from "@/components/admin/MediaPicker";

const POSITIONS = ["MÅLMÆND", "FORSVAR", "MIDTBANE", "ANGREB"] as const;
const FALLBACK_SEASON = "2024/25";

const empty = { number: "", name: "", position: "FORSVAR" as Player["position"], image_url: "" };

type PlayerStatsWithPlayer = PlayerStats & { players?: { id: string; name: string; number: string; position: string } };

export default function AdminSpillerePage() {
  const [currentSeason, setCurrentSeason] = useState(FALLBACK_SEASON);
  const [players, setPlayers] = useState<Player[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statsSaving, setStatsSaving] = useState(false);

  // Stats state
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [allStats, setAllStats] = useState<PlayerStatsWithPlayer[]>([]);
  const [statsForm, setStatsForm] = useState({ season: FALLBACK_SEASON, goals: 0, assists: 0, appearances: 0, yellow_cards: 0, red_cards: 0 });
  const [statsEditId, setStatsEditId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncSeason, setSyncSeason] = useState(FALLBACK_SEASON);

  const load = useCallback(async () => {
    const res = await fetch("/api/players");
    const data = await res.json().catch(() => []);
    setPlayers(Array.isArray(data) ? sortPlayersByNumber(data as Player[], "asc") : []);
  }, []);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/players/stats");
    const data = await res.json().catch(() => []);
    setAllStats(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    load();
    loadStats();
    fetch("/api/settings")
      .then((r) => r.json())
      .then((settings: { key: string; value: string }[]) => {
        const season = settings.find((s) => s.key === "current_season")?.value;
        if (season) {
          setCurrentSeason(season);
          setSyncSeason(season);
          setStatsForm((prev) => ({ ...prev, season }));
        }
      })
      .catch(() => {});
  }, [load, loadStats]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        const res = await fetch(`/api/players/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
          body: JSON.stringify(form),
        });
        if (!res.ok) { alert("Noget gik galt. Prøv igen."); return; }
        setEditId(null);
      } else {
        const res = await fetch("/api/players", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
          body: JSON.stringify(form),
        });
        if (!res.ok) { alert("Noget gik galt. Prøv igen."); return; }
      }
      setForm(empty);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Slet spiller?")) return;
    const res = await fetch(`/api/players/${id}`, { method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" } });
    if (!res.ok) { alert("Noget gik galt. Prøv igen."); return; }
    load();
  }

  function startEdit(player: Player) {
    setEditId(player.id);
    setForm({ number: player.number, name: player.name, position: player.position, image_url: player.image_url ?? "" });
  }

  function toggleStats(playerId: string) {
    setExpandedPlayerId((prev) => (prev === playerId ? null : playerId));
    setStatsEditId(null);
    setStatsForm({ season: currentSeason, goals: 0, assists: 0, appearances: 0, yellow_cards: 0, red_cards: 0 });
  }

  function playerStats(playerId: string) {
    return allStats.filter((s) => s.player_id === playerId);
  }

  function startStatsEdit(s: PlayerStats) {
    setStatsEditId(s.id);
    setStatsForm({
      season: s.season,
      goals: s.goals,
      assists: s.assists,
      appearances: s.appearances,
      yellow_cards: s.yellow_cards,
      red_cards: s.red_cards,
    });
  }

  async function handleStatsSubmit(e: React.FormEvent, playerId: string) {
    e.preventDefault();
    const payload = {
      player_id: playerId,
      season: statsForm.season,
      goals: Number(statsForm.goals),
      assists: Number(statsForm.assists),
      appearances: Number(statsForm.appearances),
      yellow_cards: Number(statsForm.yellow_cards),
      red_cards: Number(statsForm.red_cards),
    };
    setStatsSaving(true);
    try {
      if (statsEditId) {
        const res = await fetch(`/api/admin/players/stats/${statsEditId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { alert("Noget gik galt. Prøv igen."); return; }
        setStatsEditId(null);
      } else {
        const res = await fetch("/api/admin/players/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { alert("Noget gik galt. Prøv igen."); return; }
      }
      setStatsForm({ season: currentSeason, goals: 0, assists: 0, appearances: 0, yellow_cards: 0, red_cards: 0 });
      loadStats();
    } finally {
      setStatsSaving(false);
    }
  }

  async function handleStatsDelete(id: string) {
    if (!confirm("Slet statistik-række?")) return;
    const res = await fetch(`/api/admin/players/stats/${id}`, { method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" } });
    if (!res.ok) { alert("Noget gik galt. Prøv igen."); return; }
    loadStats();
  }

  async function handleSync() {
    if (!syncSeason.trim()) return;
    setSyncing(true);
    const res = await fetch("/api/admin/players/stats/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: JSON.stringify({ season: syncSeason }),
    });
    const result = await res.json();
    setSyncing(false);
    loadStats();
    alert(res.ok ? `Synkroniseret ${result.synced} spillere for ${syncSeason}` : `Fejl: ${result.error}`);
  }

  const inputCls = "w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors";
  const labelCls = "block text-[10px] font-bold tracking-widest uppercase mb-1 text-gray-600";
  const numInputCls = "w-16 border border-gray-300 px-2 py-1.5 text-sm text-center focus:outline-none focus:border-black transition-colors";

  return (
    <div>
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Admin</p>
        <h1 className="font-display text-3xl">SPILLERE</h1>
      </div>

      {/* Add/Edit form */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-xs font-bold tracking-widest uppercase mb-5">
          {editId ? "Redigér spiller" : "Tilføj spiller"}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={labelCls}>Trøjenr.</label>
            <input type="text" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className={inputCls} placeholder="09" required />
          </div>
          <div>
            <label className={labelCls}>Navn</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Mads Hansen" required />
          </div>
          <div>
            <label className={labelCls}>Position</label>
            <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value as Player["position"] })} className={`${inputCls} bg-white appearance-none`}>
              {POSITIONS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Billede</label>
            <div className="flex gap-2">
              <input type="text" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className={`${inputCls} flex-1 min-w-0`} placeholder="URL..." />
              <MediaPicker onSelect={(url) => setForm((f) => ({ ...f, image_url: url }))} label="↑" />
            </div>
          </div>
          <div className="col-span-2 md:col-span-4 flex gap-2">
            <button type="submit" disabled={saving} className="text-xs font-bold tracking-widest uppercase bg-black text-white px-6 py-2.5 hover:bg-gray-900 transition-colors disabled:opacity-50">
              {saving ? "GEMMER..." : editId ? "GEM" : "TILFØJ"}
            </button>
            {editId && (
              <button type="button" onClick={() => { setEditId(null); setForm(empty); }} className="text-xs font-bold tracking-widest uppercase border border-gray-300 px-6 py-2.5 hover:border-black transition-colors">
                Annullér
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Sync section */}
      <div className="bg-white border border-gray-200 p-4 mb-6 flex items-center gap-4">
        <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">Sync statistik fra kampe</span>
        <input
          type="text"
          value={syncSeason}
          onChange={(e) => setSyncSeason(e.target.value)}
          className="border border-gray-300 px-3 py-1.5 text-sm w-28 focus:outline-none focus:border-black"
          placeholder="2024/25"
        />
        <button
          onClick={handleSync}
          disabled={syncing}
          className="text-xs font-bold tracking-widest uppercase bg-black text-white px-4 py-2 hover:bg-gray-900 transition-colors disabled:opacity-50"
        >
          {syncing ? "Synkroniserer..." : "SYNC SÆSON"}
        </button>
      </div>

      {/* Players table */}
      <div className="bg-white border border-gray-200">
        <div className="hidden md:grid grid-cols-12 text-[9px] font-bold tracking-widest uppercase text-gray-400 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <span className="col-span-1">#</span>
          <span className="col-span-4">Navn</span>
          <span className="col-span-3">Position</span>
          <span className="col-span-4 text-right">Handlinger</span>
        </div>
        {Array.isArray(players) && players.map((p) => (
          <div key={p.id}>
            <div className="border-b border-gray-100 hover:bg-gray-50">
              {/* Mobile card */}
              <div className="md:hidden px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-display text-lg text-gray-300 shrink-0 w-6">{p.number}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase">{p.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleStats(p.id)} className="text-[10px] font-bold tracking-widest uppercase text-blue-500 hover:text-blue-700">
                      {expandedPlayerId === p.id ? "LUK" : "STATS"}
                    </button>
                    <button onClick={() => startEdit(p)} className="text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-black">Ret</button>
                    <button onClick={() => handleDelete(p.id)} className="text-[10px] font-bold tracking-widest uppercase text-red-400 hover:text-red-600">Slet</button>
                  </div>
                </div>
              </div>
              {/* Desktop row */}
              <div className="hidden md:grid grid-cols-12 items-center px-4 py-3">
                <span className="col-span-1 font-display text-lg text-gray-300">{p.number}</span>
                <span className="col-span-4 text-xs font-bold uppercase tracking-wide">{p.name}</span>
                <span className="col-span-3 text-[10px] text-gray-400 uppercase">{p.position}</span>
                <div className="col-span-4 flex items-center justify-end gap-2">
                  <button
                    onClick={() => toggleStats(p.id)}
                    className="text-[10px] font-bold tracking-widest uppercase text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    {expandedPlayerId === p.id ? "LUK STATS" : "STATS"}
                  </button>
                  <button onClick={() => startEdit(p)} className="text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-black transition-colors">
                    Redigér
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="text-[10px] font-bold tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors">
                    Slet
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded stats panel */}
            {expandedPlayerId === p.id && (
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-5">
                <h3 className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-4">Statistik — {p.name}</h3>

                {/* Existing stats rows */}
                {playerStats(p.id).length > 0 && (
                  <div className="mb-4">
                    <div className="hidden md:grid grid-cols-9 text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-2">
                      <span className="col-span-2">Sæson</span>
                      <span className="text-center">Mål</span>
                      <span className="text-center">Assists</span>
                      <span className="text-center">Kampe</span>
                      <span className="text-center">GK</span>
                      <span className="text-center">RK</span>
                      <span className="col-span-2 text-right">Handl.</span>
                    </div>
                    {playerStats(p.id).map((s) => (
                      <div key={s.id} className="border-t border-gray-200">
                        {/* Mobile stats card */}
                        <div className="md:hidden py-2 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold">{s.season}</span>
                            <span className="text-[10px] text-gray-500 ml-2">{s.goals}m {s.assists}a {s.appearances}k</span>
                            {s.yellow_cards > 0 && <span className="text-[10px] text-yellow-500 ml-1">{s.yellow_cards}gk</span>}
                            {s.red_cards > 0 && <span className="text-[10px] text-red-500 ml-1">{s.red_cards}rk</span>}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => startStatsEdit(s)} className="text-[10px] font-bold uppercase text-gray-500 hover:text-black">Ret</button>
                            <button onClick={() => handleStatsDelete(s.id)} className="text-[10px] font-bold uppercase text-red-400 hover:text-red-600">Slet</button>
                          </div>
                        </div>
                        {/* Desktop stats row */}
                        <div className="hidden md:grid grid-cols-9 items-center py-1.5 text-xs">
                          <span className="col-span-2 font-bold">{s.season}</span>
                          <span className="text-center">{s.goals}</span>
                          <span className="text-center">{s.assists}</span>
                          <span className="text-center">{s.appearances}</span>
                          <span className="text-center text-yellow-500">{s.yellow_cards}</span>
                          <span className="text-center text-red-500">{s.red_cards}</span>
                          <div className="col-span-2 flex justify-end gap-2">
                            <button onClick={() => startStatsEdit(s)} className="text-[10px] font-bold uppercase text-gray-500 hover:text-black">Ret</button>
                            <button onClick={() => handleStatsDelete(s.id)} className="text-[10px] font-bold uppercase text-red-400 hover:text-red-600">Slet</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add/edit stats form */}
                <form onSubmit={(e) => handleStatsSubmit(e, p.id)} className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className={labelCls}>Sæson</label>
                    <input type="text" value={statsForm.season} onChange={(e) => setStatsForm({ ...statsForm, season: e.target.value })} className="border border-gray-300 px-2 py-1.5 text-sm w-20 focus:outline-none focus:border-black" required />
                  </div>
                  <div>
                    <label className={labelCls}>Mål</label>
                    <input type="number" min={0} value={statsForm.goals} onChange={(e) => setStatsForm({ ...statsForm, goals: Number(e.target.value) })} className={numInputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Assists</label>
                    <input type="number" min={0} value={statsForm.assists} onChange={(e) => setStatsForm({ ...statsForm, assists: Number(e.target.value) })} className={numInputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Kampe</label>
                    <input type="number" min={0} value={statsForm.appearances} onChange={(e) => setStatsForm({ ...statsForm, appearances: Number(e.target.value) })} className={numInputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>GK</label>
                    <input type="number" min={0} value={statsForm.yellow_cards} onChange={(e) => setStatsForm({ ...statsForm, yellow_cards: Number(e.target.value) })} className={numInputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>RK</label>
                    <input type="number" min={0} value={statsForm.red_cards} onChange={(e) => setStatsForm({ ...statsForm, red_cards: Number(e.target.value) })} className={numInputCls} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={statsSaving} className="text-[10px] font-bold tracking-widest uppercase bg-black text-white px-4 py-2 hover:bg-gray-900 transition-colors disabled:opacity-50">
                      {statsSaving ? "GEMMER..." : statsEditId ? "GEM" : "TILFØJ"}
                    </button>
                    {statsEditId && (
                      <button type="button" onClick={() => { setStatsEditId(null); setStatsForm({ season: currentSeason, goals: 0, assists: 0, appearances: 0, yellow_cards: 0, red_cards: 0 }); }} className="text-[10px] font-bold tracking-widest uppercase border border-gray-300 px-4 py-2 hover:border-black">
                        Annullér
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        ))}
        {(!Array.isArray(players) || players.length === 0) && (
          <div className="px-4 py-8 text-center text-xs text-gray-400">
            {!Array.isArray(players) ? "Kunne ikke indlæse spillere." : "Ingen spillere endnu."}
          </div>
        )}
      </div>
    </div>
  );
}
