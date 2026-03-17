"use client";

import { useState, useEffect, useCallback } from "react";
import type { VolunteerRole } from "@/lib/supabase";

const empty = { title: "", description: "", tasks: "", display_order: 0 };

export default function AdminFrivilligPage() {
  const [roles, setRoles] = useState<VolunteerRole[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/volunteer-roles");
    const data = await res.json().catch(() => []);
    setRoles(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      tasks: form.tasks.split(",").map((s) => s.trim()).filter(Boolean),
      display_order: Number(form.display_order),
    };
    if (editId) {
      await fetch(`/api/volunteer-roles/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setEditId(null);
    } else {
      await fetch("/api/volunteer-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setForm(empty);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Slet rolle?")) return;
    await fetch(`/api/volunteer-roles/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(r: VolunteerRole) {
    setEditId(r.id);
    setForm({
      title: r.title,
      description: r.description,
      tasks: r.tasks.join(", "),
      display_order: r.display_order,
    });
  }

  const inputCls = "w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors";
  const textareaCls = `${inputCls} resize-none`;
  const labelCls = "block text-[10px] font-bold tracking-widest uppercase mb-1 text-gray-600";

  return (
    <div>
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Admin</p>
        <h1 className="font-display text-3xl">FRIVILLIGE ROLLER</h1>
      </div>

      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-xs font-bold tracking-widest uppercase mb-5">
          {editId ? "Redigér rolle" : "Tilføj rolle"}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Titel</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="Træner & Holdleder" required />
          </div>
          <div>
            <label className={labelCls}>Rækkefølge</label>
            <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} className={inputCls} />
          </div>
          <div className="col-span-2 md:col-span-3">
            <label className={labelCls}>Beskrivelse</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={textareaCls} placeholder="Beskrivelse af rollen..." required />
          </div>
          <div className="col-span-2 md:col-span-3">
            <label className={labelCls}>Opgaver (kommasepareret)</label>
            <textarea rows={2} value={form.tasks} onChange={(e) => setForm({ ...form, tasks: e.target.value })} className={textareaCls} placeholder="Ledelse af træninger, Kampledelse og tilmelding" />
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

      <div className="bg-white border border-gray-200">
        <div className="grid grid-cols-12 text-[9px] font-bold tracking-widest uppercase text-gray-400 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <span className="col-span-3">Titel</span>
          <span className="col-span-7">Beskrivelse</span>
          <span className="col-span-2 text-right">Handlinger</span>
        </div>
        {roles.map((r) => (
          <div key={r.id} className="grid grid-cols-12 items-center px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
            <span className="col-span-3 font-bold text-xs uppercase tracking-wide">{r.title}</span>
            <span className="col-span-7 text-[10px] text-gray-400 truncate">{r.description}</span>
            <div className="col-span-2 flex items-center justify-end gap-2">
              <button onClick={() => startEdit(r)} className="text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-black transition-colors">
                Redigér
              </button>
              <button onClick={() => handleDelete(r.id)} className="text-[10px] font-bold tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors">
                Slet
              </button>
            </div>
          </div>
        ))}
        {roles.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-gray-400">Ingen roller endnu.</div>
        )}
      </div>
    </div>
  );
}
