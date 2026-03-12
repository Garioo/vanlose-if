"use client";

import { useState, useEffect, useCallback } from "react";
import type { Player } from "@/lib/supabase";
import { sortPlayersByNumber } from "@/lib/playerSort";

const POSITIONS = ["MÅLMÆND", "FORSVAR", "MIDTBANE", "ANGREB"] as const;

const empty = { number: "", name: "", position: "FORSVAR" as Player["position"], image_url: "" };

export default function AdminSpillerePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/players");
    const data = await res.json().catch(() => []);
    setPlayers(Array.isArray(data) ? sortPlayersByNumber(data as Player[], "asc") : []);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const { url } = await res.json();
    setForm((f) => ({ ...f, image_url: url }));
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editId) {
      await fetch(`/api/players/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setEditId(null);
    } else {
      await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm(empty);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Slet spiller?")) return;
    await fetch(`/api/players/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(player: Player) {
    setEditId(player.id);
    setForm({ number: player.number, name: player.name, position: player.position, image_url: player.image_url ?? "" });
  }

  const inputCls = "w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors";
  const labelCls = "block text-[10px] font-bold tracking-widest uppercase mb-1 text-gray-600";

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
              <input type="text" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className={`${inputCls} flex-1 min-w-0`} placeholder="/uploads/..." />
              <label className="shrink-0 text-[10px] font-bold border border-gray-300 px-2 py-2 cursor-pointer hover:border-black transition-colors">
                {uploading ? "..." : "↑"}
                <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
              </label>
            </div>
          </div>
          <div className="col-span-2 md:col-span-4 flex gap-2">
            <button type="submit" className="text-xs font-bold tracking-widest uppercase bg-black text-white px-6 py-2.5 hover:bg-gray-900 transition-colors">
              {editId ? "GEM" : "TILFØJ"}
            </button>
            {editId && (
              <button type="button" onClick={() => { setEditId(null); setForm(empty); }} className="text-xs font-bold tracking-widest uppercase border border-gray-300 px-6 py-2.5 hover:border-black transition-colors">
                Annullér
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Players table */}
      <div className="bg-white border border-gray-200">
        <div className="grid grid-cols-12 text-[9px] font-bold tracking-widest uppercase text-gray-400 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <span className="col-span-1">#</span>
          <span className="col-span-5">Navn</span>
          <span className="col-span-4">Position</span>
          <span className="col-span-2 text-right">Handlinger</span>
        </div>
        {Array.isArray(players) && players.map((p) => (
          <div key={p.id} className="grid grid-cols-12 items-center px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
            <span className="col-span-1 font-display text-lg text-gray-300">{p.number}</span>
            <span className="col-span-5 text-xs font-bold uppercase tracking-wide">{p.name}</span>
            <span className="col-span-4 text-[10px] text-gray-400 uppercase">{p.position}</span>
            <div className="col-span-2 flex items-center justify-end gap-2">
              <button onClick={() => startEdit(p)} className="text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-black transition-colors">
                Redigér
              </button>
              <button onClick={() => handleDelete(p.id)} className="text-[10px] font-bold tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors">
                Slet
              </button>
            </div>
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
