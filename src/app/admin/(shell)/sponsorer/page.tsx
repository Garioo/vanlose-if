"use client";

import { useState, useEffect, useCallback } from "react";
import type { Sponsor, SponsorTier } from "@/lib/supabase";
import MediaPicker from "@/components/admin/MediaPicker";

const TIERS: SponsorTier[] = ["guld", "sølv", "bronze"];
const TIER_LABELS: Record<SponsorTier, string> = { guld: "Guld", sølv: "Sølv", bronze: "Bronze" };

const empty = { name: "", logo_url: "", website_url: "", tier: "bronze" as SponsorTier, display_order: 0 };

export default function AdminSponsorerPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const load = useCallback(async () => {
    const res = await fetch("/api/sponsors");
    const data = await res.json().catch(() => []);
    setSponsors(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, display_order: Number(form.display_order) };
    if (editId) {
      await fetch(`/api/sponsors/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setEditId(null);
    } else {
      await fetch("/api/sponsors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setForm(empty);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Slet sponsor?")) return;
    await fetch(`/api/sponsors/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(s: Sponsor) {
    setEditId(s.id);
    setForm({ name: s.name, logo_url: s.logo_url ?? "", website_url: s.website_url ?? "", tier: s.tier, display_order: s.display_order });
  }

  const inputCls = "w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors";
  const labelCls = "block text-[10px] font-bold tracking-widest uppercase mb-1 text-gray-600";

  return (
    <div>
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Admin</p>
        <h1 className="font-display text-3xl">SPONSORER</h1>
      </div>

      {/* Add/Edit form */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-xs font-bold tracking-widest uppercase mb-5">
          {editId ? "Redigér sponsor" : "Tilføj sponsor"}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Navn</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Firmanavn" required />
          </div>
          <div>
            <label className={labelCls}>Tier</label>
            <select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as SponsorTier })} className={`${inputCls} bg-white appearance-none`}>
              {TIERS.map((t) => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Rækkefølge</label>
            <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Website URL</label>
            <input type="url" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} className={inputCls} placeholder="https://..." />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Logo</label>
            <div className="flex gap-2">
              <input type="text" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className={`${inputCls} flex-1 min-w-0`} placeholder="URL..." />
              <MediaPicker onSelect={(url) => setForm((f) => ({ ...f, logo_url: url }))} label="↑" />
            </div>
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

      {/* Sponsors table */}
      <div className="bg-white border border-gray-200">
        <div className="hidden md:grid grid-cols-12 text-[9px] font-bold tracking-widest uppercase text-gray-400 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <span className="col-span-4">Navn</span>
          <span className="col-span-2">Tier</span>
          <span className="col-span-4">Website</span>
          <span className="col-span-2 text-right">Handlinger</span>
        </div>
        {sponsors.map((s) => (
          <div key={s.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
            {/* Mobile card */}
            <div className="md:hidden px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide">{s.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase">{TIER_LABELS[s.tier]}</p>
                  {s.website_url && <p className="text-[10px] text-gray-400 truncate mt-0.5">{s.website_url}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => startEdit(s)} className="text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-black">Ret</button>
                  <button onClick={() => handleDelete(s.id)} className="text-[10px] font-bold tracking-widest uppercase text-red-400 hover:text-red-600">Slet</button>
                </div>
              </div>
            </div>
            {/* Desktop row */}
            <div className="hidden md:grid grid-cols-12 items-center px-4 py-3">
              <span className="col-span-4 text-xs font-bold uppercase tracking-wide">{s.name}</span>
              <span className="col-span-2 text-[10px] text-gray-400 uppercase">{TIER_LABELS[s.tier]}</span>
              <span className="col-span-4 text-[10px] text-gray-400 truncate">{s.website_url || "—"}</span>
              <div className="col-span-2 flex items-center justify-end gap-2">
                <button onClick={() => startEdit(s)} className="text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-black transition-colors">
                  Redigér
                </button>
                <button onClick={() => handleDelete(s.id)} className="text-[10px] font-bold tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors">
                  Slet
                </button>
              </div>
            </div>
          </div>
        ))}
        {sponsors.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-gray-400">Ingen sponsorer endnu.</div>
        )}
      </div>
    </div>
  );
}
