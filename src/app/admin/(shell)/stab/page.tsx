"use client";

import { useState, useEffect, useCallback } from "react";
import type { Staff } from "@/lib/supabase";
import MediaPicker from "@/components/admin/MediaPicker";

const empty = { name: "", role: "", image_url: "", bio: "", display_order: 0 };

export default function AdminStabPage() {
  const [members, setMembers] = useState<Staff[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/staff");
    const data = await res.json().catch(() => []);
    setMembers(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      image_url: form.image_url || null,
      bio: form.bio || null,
      display_order: Number(form.display_order),
    };
    if (editId) {
      await fetch(`/api/staff/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setEditId(null);
    } else {
      await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setForm(empty);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Slet stabsmedlem?")) return;
    await fetch(`/api/staff/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(m: Staff) {
    setEditId(m.id);
    setForm({
      name: m.name,
      role: m.role,
      image_url: m.image_url ?? "",
      bio: m.bio ?? "",
      display_order: m.display_order,
    });
  }

  const inputCls = "w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors";
  const textareaCls = `${inputCls} resize-none`;
  const labelCls = "block text-[10px] font-bold tracking-widest uppercase mb-1 text-gray-600";

  return (
    <div>
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Admin</p>
        <h1 className="font-display text-3xl">TRÆNER & STAB</h1>
      </div>

      {/* Add/Edit form */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-xs font-bold tracking-widest uppercase mb-5">
          {editId ? "Redigér stabsmedlem" : "Tilføj stabsmedlem"}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Navn</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Anders Nielsen" required />
          </div>
          <div>
            <label className={labelCls}>Rolle</label>
            <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls} placeholder="f.eks. Cheftræner" required />
          </div>
          <div>
            <label className={labelCls}>Rækkefølge</label>
            <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} className={inputCls} />
          </div>
          <div className="col-span-2 md:col-span-3">
            <label className={labelCls}>Billede</label>
            <div className="flex gap-2">
              <input type="text" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className={`${inputCls} flex-1 min-w-0`} placeholder="URL..." />
              <MediaPicker onSelect={(url) => setForm((f) => ({ ...f, image_url: url }))} label="↑" />
            </div>
            {form.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image_url} alt="" className="mt-2 h-20 w-auto object-cover border border-gray-200" />
            )}
          </div>
          <div className="col-span-2 md:col-span-3">
            <label className={labelCls}>Bio</label>
            <textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className={textareaCls} placeholder="Kort beskrivelse..." />
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

      {/* Members list */}
      <div className="bg-white border border-gray-200">
        <div className="hidden md:grid grid-cols-12 text-[9px] font-bold tracking-widest uppercase text-gray-400 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <span className="col-span-1" />
          <span className="col-span-3">Navn</span>
          <span className="col-span-4">Rolle</span>
          <span className="col-span-2">Rækkefølge</span>
          <span className="col-span-2 text-right">Handlinger</span>
        </div>
        {members.map((m) => (
          <div key={m.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
            {/* Mobile */}
            <div className="md:hidden px-4 py-3 flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 bg-gray-100 overflow-hidden">
                {m.image_url
                  ? <img src={m.image_url} alt={m.name} className="h-full w-full object-cover object-top" /> // eslint-disable-line @next/next/no-img-element
                  : <div className="h-full w-full flex items-center justify-center font-display text-lg text-gray-400">{m.name.charAt(0)}</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase truncate">{m.name}</p>
                <p className="text-[10px] text-gray-400">{m.role}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => startEdit(m)} className="text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-black">Redigér</button>
                <button onClick={() => void handleDelete(m.id)} className="text-[10px] font-bold tracking-widest uppercase text-red-400 hover:text-red-600">Slet</button>
              </div>
            </div>
            {/* Desktop */}
            <div className="hidden md:grid grid-cols-12 items-center px-4 py-3">
              <div className="col-span-1">
                <div className="h-8 w-8 bg-gray-100 overflow-hidden">
                  {m.image_url
                    ? <img src={m.image_url} alt={m.name} className="h-full w-full object-cover object-top" /> // eslint-disable-line @next/next/no-img-element
                    : <div className="h-full w-full flex items-center justify-center font-display text-sm text-gray-400">{m.name.charAt(0)}</div>
                  }
                </div>
              </div>
              <span className="col-span-3 text-xs font-bold uppercase truncate">{m.name}</span>
              <span className="col-span-4 text-xs text-gray-600 truncate">{m.role}</span>
              <span className="col-span-2 text-[10px] text-gray-400">{m.display_order}</span>
              <div className="col-span-2 flex items-center justify-end gap-2">
                <button onClick={() => startEdit(m)} className="text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-black transition-colors">Redigér</button>
                <button onClick={() => void handleDelete(m.id)} className="text-[10px] font-bold tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors">Slet</button>
              </div>
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-gray-400">Ingen stabsmedlemmer endnu.</div>
        )}
      </div>
    </div>
  );
}
