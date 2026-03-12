"use client";

import { useState, useEffect, useCallback } from "react";
import type { Standing, Team } from "@/lib/supabase";

const emptyRow = {
  pos: 1,
  team: "",
  team_id: "",
  played: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goals_scored: 0,
  goals_conceded: 0,
  pts: 0,
  highlight: false,
};

export default function AdminStillingPage() {
  const [rows, setRows] = useState<Standing[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState(emptyRow);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [standingsRes, teamsRes] = await Promise.all([
      fetch("/api/standings"),
      fetch("/api/teams")
    ]);
    
    const standingsData = await standingsRes.json();
    const teamsData = await teamsRes.json();
    
    setRows(Array.isArray(standingsData) ? standingsData : []);
    setTeams(Array.isArray(teamsData) ? teamsData : []);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const selectedTeam = teams.find((t) => t.id === form.team_id);
    const payload = { ...form, team: selectedTeam?.name ?? form.team };

    if (editId) {
      const res = await fetch(`/api/standings/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Kunne ikke opdatere stilling.");
        return;
      }
      setEditId(null);
    } else {
      const res = await fetch("/api/standings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Kunne ikke oprette stillingsrække.");
        return;
      }
    }
    setForm(emptyRow);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Fjern hold fra tabellen?")) return;
    const res = await fetch(`/api/standings/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Kunne ikke slette hold fra stilling.");
      return;
    }
    load();
  }

  function startEdit(row: Standing) {
    setEditId(row.id);
    setForm({ 
      pos: row.pos, 
      team: row.team, 
      team_id: row.team_id ?? teams.find((t) => t.name === row.team)?.id ?? "",
      played: row.played, 
      wins: row.wins, 
      draws: row.draws, 
      losses: row.losses, 
      goals_scored: row.goals_scored || 0,
      goals_conceded: row.goals_conceded || 0,
      pts: row.pts, 
      highlight: row.highlight 
    });
  }

  const inputCls = "w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors";
  const labelCls = "block text-[10px] font-bold tracking-widest uppercase mb-1 text-gray-600";
  const numInput = (field: keyof typeof emptyRow) => (
    <input type="number" min="0" value={form[field] as number} onChange={(e) => setForm({ ...form, [field]: Number(e.target.value) })} className={inputCls} />
  );

  return (
    <div>
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Admin</p>
        <h1 className="font-display text-3xl">STILLING</h1>
      </div>

      {/* Form */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-xs font-bold tracking-widest uppercase mb-5">
          {editId ? "Redigér hold" : "Tilføj hold"}
        </h2>
        {error && (
          <p className="mb-4 text-xs text-red-500">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-4 md:grid-cols-12 gap-3">
          <div className="md:col-span-1">
            <label className={labelCls}>#</label>
            {numInput("pos")}
          </div>
          <div className="col-span-3 md:col-span-3">
            <label className={labelCls}>Hold</label>
            <select 
              value={form.team_id} 
              onChange={(e) => setForm({ ...form, team_id: e.target.value })} 
              className={inputCls} 
              required
            >
              <option value="">Vælg hold</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className={labelCls}>K</label>
            {numInput("played")}
          </div>
          <div className="md:col-span-1">
            <label className={labelCls}>S</label>
            {numInput("wins")}
          </div>
          <div className="md:col-span-1">
            <label className={labelCls}>U</label>
            {numInput("draws")}
          </div>
          <div className="md:col-span-1">
            <label className={labelCls}>N</label>
            {numInput("losses")}
          </div>
          <div className="md:col-span-1">
            <label className={labelCls}>M+</label>
            {numInput("goals_scored")}
          </div>
          <div className="md:col-span-1">
            <label className={labelCls}>M-</label>
            {numInput("goals_conceded")}
          </div>
          <div className="md:col-span-1">
            <label className={labelCls}>Pts</label>
            {numInput("pts")}
          </div>
          <div className="col-span-1 flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.highlight} onChange={(e) => setForm({ ...form, highlight: e.target.checked })} className="w-4 h-4" />
              <span className="text-[10px] font-bold tracking-widest uppercase">VIF</span>
            </label>
          </div>
          <div className="col-span-4 md:col-span-12 flex gap-2 pt-2">
            <button type="submit" className="text-xs font-bold tracking-widest uppercase bg-black text-white px-6 py-2.5 hover:bg-gray-900 transition-colors">
              {editId ? "GEM" : "TILFØJ"}
            </button>
            {editId && (
              <button type="button" onClick={() => { setEditId(null); setForm(emptyRow); }} className="text-xs font-bold tracking-widest uppercase border border-gray-300 px-6 py-2.5 hover:border-black transition-colors">
                Annullér
              </button>
            )}
            <p className="text-[9px] text-gray-400 self-center ml-auto">
              Tips: Opret hold under &quot;Hold&quot; menuen først.
            </p>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200">
        <div className="grid grid-cols-12 text-[9px] font-bold tracking-widest uppercase text-gray-400 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <span className="col-span-1">#</span>
          <span className="col-span-3">Hold</span>
          <span className="text-center">K</span>
          <span className="text-center">S</span>
          <span className="text-center">U</span>
          <span className="text-center">N</span>
          <span className="text-center">Mål</span>
          <span className="text-center">Pts</span>
          <span className="col-span-2 text-right">Handlinger</span>
        </div>
        {Array.isArray(rows) && rows.map((row) => (
          <div key={row.id} className={`grid grid-cols-12 items-center px-4 py-3 border-b border-gray-100 last:border-0 ${row.highlight ? "bg-black text-white" : "hover:bg-gray-50"}`}>
            <span className="col-span-1 text-xs font-bold">{row.pos}</span>
            <span className="col-span-3 text-xs font-bold uppercase tracking-wide truncate">{row.team}</span>
            <span className="text-center text-xs">{row.played}</span>
            <span className="text-center text-xs">{row.wins}</span>
            <span className="text-center text-xs">{row.draws}</span>
            <span className="text-center text-xs">{row.losses}</span>
            <span className="text-center text-xs">{row.goals_scored || 0}-{row.goals_conceded || 0}</span>
            <span className="text-center text-xs font-bold">{row.pts}</span>
            <div className="col-span-2 flex items-center justify-end gap-2">
              <button onClick={() => startEdit(row)} className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${row.highlight ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"}`}>
                Redigér
              </button>
              <button onClick={() => handleDelete(row.id)} className="text-[10px] font-bold tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors">
                Slet
              </button>
            </div>
          </div>
        ))}
        {(!Array.isArray(rows) || rows.length === 0) && (
          <div className="px-4 py-8 text-center text-xs text-gray-400">
            {!Array.isArray(rows) ? "Kunne ikke indlæse hold." : "Tabellen er tom."}
          </div>
        )}
      </div>
    </div>
  );
}
