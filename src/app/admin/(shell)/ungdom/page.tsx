"use client";

import { useState, useEffect, useCallback } from "react";
import type { YouthTeam } from "@/lib/supabase";

const empty = { age_group: "", coach: "", training_schedule: "", description: "", display_order: 0 };

export default function AdminUngdomPage() {
  const [teams, setTeams] = useState<YouthTeam[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/youth-teams");
    const data = await res.json().catch(() => []);
    setTeams(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, display_order: Number(form.display_order) };
    if (editId) {
      await fetch(`/api/youth-teams/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setEditId(null);
    } else {
      await fetch("/api/youth-teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setForm(empty);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Slet hold?")) return;
    await fetch(`/api/youth-teams/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(t: YouthTeam) {
    setEditId(t.id);
    setForm({
      age_group: t.age_group,
      coach: t.coach ?? "",
      training_schedule: t.training_schedule ?? "",
      description: t.description ?? "",
      display_order: t.display_order,
    });
  }

  const inputCls = "w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors";
  const textareaCls = `${inputCls} resize-none`;
  const labelCls = "block text-[10px] font-bold tracking-widest uppercase mb-1 text-gray-600";

  return (
    <div>
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Admin</p>
        <h1 className="font-display text-3xl">UNGDOMSHOLD</h1>
      </div>

      {/* Add/Edit form */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-xs font-bold tracking-widest uppercase mb-5">
          {editId ? "Redigér hold" : "Tilføj hold"}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Aldersgruppe</label>
            <input type="text" value={form.age_group} onChange={(e) => setForm({ ...form, age_group: e.target.value })} className={inputCls} placeholder="U10" required />
          </div>
          <div>
            <label className={labelCls}>Træner</label>
            <input type="text" value={form.coach} onChange={(e) => setForm({ ...form, coach: e.target.value })} className={inputCls} placeholder="Navn på træner" />
          </div>
          <div>
            <label className={labelCls}>Rækkefølge</label>
            <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} className={inputCls} />
          </div>
          <div className="col-span-2 md:col-span-3">
            <label className={labelCls}>Træningstider</label>
            <textarea rows={2} value={form.training_schedule} onChange={(e) => setForm({ ...form, training_schedule: e.target.value })} className={textareaCls} placeholder="Tirsdag 16:00, Torsdag 17:00" />
          </div>
          <div className="col-span-2 md:col-span-3">
            <label className={labelCls}>Beskrivelse</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={textareaCls} placeholder="Kort beskrivelse af holdet..." />
          </div>
          <div className="col-span-2 md:col-span-3 flex gap-2">
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

      {/* Teams list */}
      <div className="bg-white border border-gray-200">
        <div className="grid grid-cols-12 text-[9px] font-bold tracking-widest uppercase text-gray-400 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <span className="col-span-2">Gruppe</span>
          <span className="col-span-3">Træner</span>
          <span className="col-span-5">Træningstider</span>
          <span className="col-span-2 text-right">Handlinger</span>
        </div>
        {teams.map((t) => (
          <div key={t.id} className="grid grid-cols-12 items-center px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
            <span className="col-span-2 font-display text-lg text-gray-700">{t.age_group}</span>
            <span className="col-span-3 text-xs text-gray-600">{t.coach || "—"}</span>
            <span className="col-span-5 text-[10px] text-gray-400 truncate">{t.training_schedule || "—"}</span>
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
          <div className="px-4 py-8 text-center text-xs text-gray-400">Ingen ungdomshold endnu.</div>
        )}
      </div>
    </div>
  );
}
