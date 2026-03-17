"use client";

import { useState, useEffect, useCallback } from "react";
import type { MembershipTier } from "@/lib/supabase";

const empty = { name: "", price: "", unit: "kr/år", description: "", perks: "", featured: false, display_order: 0 };

export default function AdminMedlemskaberPage() {
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/membership-tiers");
    const data = await res.json().catch(() => []);
    setTiers(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      perks: form.perks.split(",").map((s) => s.trim()).filter(Boolean),
      display_order: Number(form.display_order),
    };
    if (editId) {
      await fetch(`/api/membership-tiers/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setEditId(null);
    } else {
      await fetch("/api/membership-tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setForm(empty);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Slet medlemskab?")) return;
    await fetch(`/api/membership-tiers/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(t: MembershipTier) {
    setEditId(t.id);
    setForm({
      name: t.name,
      price: t.price,
      unit: t.unit,
      description: t.description,
      perks: t.perks.join(", "),
      featured: t.featured,
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
        <h1 className="font-display text-3xl">MEDLEMSKABER</h1>
      </div>

      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-xs font-bold tracking-widest uppercase mb-5">
          {editId ? "Redigér medlemskab" : "Tilføj medlemskab"}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={labelCls}>Navn</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Aktiv" required />
          </div>
          <div>
            <label className={labelCls}>Pris</label>
            <input type="text" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} placeholder="650" required />
          </div>
          <div>
            <label className={labelCls}>Enhed</label>
            <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={inputCls} placeholder="kr/år" required />
          </div>
          <div>
            <label className={labelCls}>Rækkefølge</label>
            <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} className={inputCls} />
          </div>
          <div className="col-span-2 md:col-span-4">
            <label className={labelCls}>Beskrivelse</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} placeholder="Kort beskrivelse..." required />
          </div>
          <div className="col-span-2 md:col-span-4">
            <label className={labelCls}>Fordele (kommasepareret)</label>
            <textarea rows={2} value={form.perks} onChange={(e) => setForm({ ...form, perks: e.target.value })} className={textareaCls} placeholder="Nyhedsbrev og invitationer, Stemmeret på generalforsamling" />
          </div>
          <div className="col-span-2 md:col-span-4 flex items-center gap-3">
            <input type="checkbox" id="featured" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="featured" className="text-xs font-bold tracking-widest uppercase text-gray-600">Mest valgt (fremhævet)</label>
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

      <div className="bg-white border border-gray-200">
        <div className="grid grid-cols-12 text-[9px] font-bold tracking-widest uppercase text-gray-400 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <span className="col-span-2">Navn</span>
          <span className="col-span-2">Pris</span>
          <span className="col-span-5">Beskrivelse</span>
          <span className="col-span-1 text-center">Fremhævet</span>
          <span className="col-span-2 text-right">Handlinger</span>
        </div>
        {tiers.map((t) => (
          <div key={t.id} className="grid grid-cols-12 items-center px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
            <span className="col-span-2 font-bold text-sm">{t.name}</span>
            <span className="col-span-2 text-xs text-gray-600">{t.price} {t.unit}</span>
            <span className="col-span-5 text-[10px] text-gray-400 truncate">{t.description}</span>
            <span className="col-span-1 text-center text-xs">{t.featured ? "✓" : "—"}</span>
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
        {tiers.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-gray-400">Ingen medlemskaber endnu.</div>
        )}
      </div>
    </div>
  );
}
