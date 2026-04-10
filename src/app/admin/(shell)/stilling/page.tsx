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
  gruppe: "regular",
};

export default function AdminStillingPage() {
  const [rows, setRows] = useState<Standing[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState(emptyRow);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [splitLoading, setSplitLoading] = useState(false);

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

  async function handleSplit() {
    if (!confirm("Split stilling i Oprykningsspil og Nedrykningsspil? De øverste halvdel rykker op i Oprykningsspil.")) return;
    setSplitLoading(true);
    setError(null);
    const res = await fetch("/api/standings/split", { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Kunne ikke splitte stilling.");
    } else {
      load();
    }
    setSplitLoading(false);
  }

  async function handleResetSplit() {
    if (!confirm("Nulstil til grundspil? Alle hold sættes tilbage til én samlet tabel.")) return;
    setSplitLoading(true);
    setError(null);
    const res = await fetch("/api/standings/split", { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Kunne ikke nulstille split.");
    } else {
      load();
    }
    setSplitLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
      highlight: row.highlight,
      gruppe: row.gruppe ?? "regular",
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
          <div className="col-span-4 md:col-span-2">
            <label className={labelCls}>Gruppe</label>
            <select
              value={form.gruppe}
              onChange={(e) => setForm({ ...form, gruppe: e.target.value })}
              className={inputCls}
            >
              <option value="regular">Grundspil</option>
              <option value="oprykning">Oprykningsspil</option>
              <option value="nedrykning">Nedrykningsspil</option>
            </select>
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

      {/* Playoff split actions */}
      {(() => {
        const isPlayoff = rows.some((r) => r.gruppe !== "regular");
        return (
          <div className="flex items-center gap-3 mb-4">
            {!isPlayoff ? (
              <button
                type="button"
                onClick={handleSplit}
                disabled={splitLoading || rows.length === 0}
                className="text-xs font-bold tracking-widest uppercase bg-black text-white px-5 py-2.5 hover:bg-gray-900 transition-colors disabled:opacity-40"
              >
                {splitLoading ? "Splitter..." : "SPLIT TIL PLAYOFF"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetSplit}
                disabled={splitLoading}
                className="text-xs font-bold tracking-widest uppercase border border-gray-400 px-5 py-2.5 hover:border-black transition-colors disabled:opacity-40"
              >
                {splitLoading ? "Nulstiller..." : "NULSTIL TIL GRUNDSPIL"}
              </button>
            )}
            <p className="text-[9px] text-gray-400">
              {isPlayoff
                ? "Stilling er splittet i Oprykningsspil og Nedrykningsspil."
                : "Splitter øverste halvdel til Oprykningsspil, nederste til Nedrykningsspil."}
            </p>
          </div>
        );
      })()}

      {/* Table */}
      {(() => {
        const isPlayoff = Array.isArray(rows) && rows.some((r) => r.gruppe !== "regular");
        const groups: Array<{ key: string; label: string; colorCls: string }> = isPlayoff
          ? [
              { key: "oprykning", label: "OPRYKNINGSSPIL", colorCls: "bg-green-50 text-green-800" },
              { key: "nedrykning", label: "NEDRYKNINGSSPIL", colorCls: "bg-red-50 text-red-800" },
            ]
          : [{ key: "regular", label: "", colorCls: "" }];

        const colHeader = (
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
        );

        const renderRow = (row: Standing) => (
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
        );

        if (!Array.isArray(rows) || rows.length === 0) {
          return (
            <div className="bg-white border border-gray-200 px-4 py-8 text-center text-xs text-gray-400">
              {!Array.isArray(rows) ? "Kunne ikke indlæse hold." : "Tabellen er tom."}
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-6">
            {groups.map(({ key, label, colorCls }) => {
              const groupRows = isPlayoff ? rows.filter((r) => r.gruppe === key) : rows;
              return (
                <div key={key} className="bg-white border border-gray-200">
                  {isPlayoff && (
                    <div className={`px-4 py-2 text-[10px] font-bold tracking-widest uppercase ${colorCls}`}>
                      {label}
                    </div>
                  )}
                  {colHeader}
                  {groupRows.map(renderRow)}
                  {groupRows.length === 0 && (
                    <div className="px-4 py-6 text-center text-xs text-gray-400">Ingen hold.</div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
