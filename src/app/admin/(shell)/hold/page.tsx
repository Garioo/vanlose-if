"use client";

import { useState, useEffect, useCallback } from "react";
import type { Team } from "@/lib/supabase";
import MediaPicker from "@/components/admin/MediaPicker";

const empty = { name: "", abbreviation: "", home_turf: "", logo_url: "" };

export default function AdminHoldPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/teams");
    const data = await res.json();
    setTeams(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editId) {
        const res = await fetch(`/api/teams/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Kunne ikke opdatere hold.");
        }
        setEditId(null);
      } else {
        const res = await fetch("/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Kunne ikke oprette hold.");
        }
      }
      setForm(empty);
      load();
    } catch (err) {
      console.error("Submit error:", err);
      setError(err instanceof Error ? err.message : "Der opstod en fejl.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Slet hold? Dette kan påvirke kampe og stilling.")) return;
    const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Kunne ikke slette hold.");
      return;
    }
    load();
  }

  function startEdit(team: Team) {
    setEditId(team.id);
    setForm({
      name: team.name,
      abbreviation: team.abbreviation ?? "",
      home_turf: team.home_turf ?? "",
      logo_url: team.logo_url ?? "",
    });
  }

  const inputCls = "w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors";
  const labelCls = "block text-[10px] font-bold tracking-widest uppercase mb-1 text-gray-600";

  return (
    <div>
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Admin</p>
        <h1 className="font-display text-3xl">HOLD / KLUBBER</h1>
      </div>

      {/* Add/Edit form */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-xs font-bold tracking-widest uppercase mb-5">
          {editId ? "Redigér hold" : "Tilføj nyt hold"}
        </h2>
        {error && (
          <p className="mb-4 text-xs text-red-500">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Holdnavn</label>
            <input 
              type="text" 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              className={inputCls} 
              placeholder="F.eks. HIK, Brønshøj Boldklub" 
              required 
            />
          </div>
          <div>
            <label className={labelCls}>Forkortelse</label>
            <input
              type="text"
              value={form.abbreviation}
              onChange={(e) => setForm({ ...form, abbreviation: e.target.value.toUpperCase() })}
              className={inputCls}
              placeholder="F.eks. VIF, FCK, VB"
              maxLength={6}
            />
          </div>
          <div>
            <label className={labelCls}>Hjemmebane</label>
            <input
              type="text"
              value={form.home_turf}
              onChange={(e) => setForm({ ...form, home_turf: e.target.value })}
              className={inputCls}
              placeholder="F.eks. Vanløse Idrætspark"
            />
          </div>
          <div>
            <label className={labelCls}>Logo (valgfrit)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                className={`${inputCls} flex-1 min-w-0`}
                placeholder="URL..."
              />
              <MediaPicker onSelect={(url) => setForm((f) => ({ ...f, logo_url: url }))} label="↑" />
            </div>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="text-xs font-bold tracking-widest uppercase bg-black text-white px-6 py-2.5 hover:bg-gray-900 transition-colors">
              {editId ? "GEM" : "TILFØJ"}
            </button>
            {editId && (
              <button 
                type="button" 
                onClick={() => { setEditId(null); setForm(empty); }} 
                className="text-xs font-bold tracking-widest uppercase border border-gray-300 px-6 py-2.5 hover:border-black transition-colors"
              >
                Annullér
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Teams list */}
      <div className="bg-white border border-gray-200">
        <div className="grid grid-cols-12 text-[9px] font-bold tracking-widest uppercase text-gray-400 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <span className="col-span-1">Logo</span>
          <span className="col-span-4">Navn</span>
          <span className="col-span-2">Fork.</span>
          <span className="col-span-3">Hjemmebane</span>
          <span className="col-span-2 text-right">Handlinger</span>
        </div>
        {teams.map((t) => (
          <div key={t.id} className="grid grid-cols-12 items-center px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
            <div className="col-span-1 h-8 w-8 bg-gray-50 flex items-center justify-center p-1 border border-gray-100">
              {t.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.logo_url} alt="" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-[10px] text-gray-300 font-bold">{t.name.substring(0, 1)}</span>
              )}
            </div>
            <span className="col-span-4 ml-4 text-xs font-bold uppercase tracking-wide">{t.name}</span>
            <span className="col-span-2 text-xs font-bold uppercase tracking-widest text-gray-600">
              {t.abbreviation || "—"}
            </span>
            <span className="col-span-3 text-xs text-gray-500 truncate">{t.home_turf || "—"}</span>
            <div className="col-span-2 flex items-center justify-end gap-2">
              <button onClick={() => startEdit(t)} className="text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-black transition-colors">
                Redigér
              </button>
              <button onClick={() => handleDelete(t.id)} className="text-[10px] font-bold tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors">
                Slet
              </button>
            </div>
          </div>
        ))}
        {teams.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-gray-400">
            Ingen hold oprettet endnu.
          </div>
        )}
      </div>
    </div>
  );
}
