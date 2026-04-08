"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Article } from "@/lib/supabase";
import TiptapEditor from "@/components/TiptapEditor";
import MediaPicker from "@/components/admin/MediaPicker";

interface Props {
  article?: Partial<Article>;
}

export default function ArticleForm({ article }: Props) {
  const router = useRouter();
  const isEdit = !!article?.id;

  const [form, setForm] = useState({
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    category: article?.category ?? "KLUB",
    date: article?.date ?? "",
    excerpt: article?.excerpt ?? "",
    content: article?.content ?? "",
    image_url: article?.image_url ?? "",
    latest: article?.latest ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function slugify(s: string) {
    return s
      .toLowerCase()
      .replace(/[æ]/g, "ae").replace(/[ø]/g, "oe").replace(/[å]/g, "aa")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: isEdit ? f.slug : slugify(title),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const strippedContent = form.content.replace(/<[^>]*>/g, "").trim();
    if (!strippedContent) {
      setError("Indhold er påkrævet.");
      setLoading(false);
      return;
    }

    const url = isEdit ? `/api/articles/${article!.id}` : "/api/articles";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (res.ok) {
      router.push("/admin/nyheder");
      router.refresh();
    } else {
      const { error } = await res.json();
      setError(error ?? "Noget gik galt.");
    }
  }

  const inputCls = "w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors";
  const labelCls = "block text-[10px] font-bold tracking-widest uppercase mb-1 text-gray-600";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Titel</label>
          <input type="text" value={form.title} onChange={(e) => handleTitleChange(e.target.value)} className={inputCls} required />
        </div>
        <div>
          <label className={labelCls}>Slug (URL)</label>
          <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputCls} required />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className={labelCls}>Kategori</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Article["category"] })} className={`${inputCls} bg-white appearance-none`}>
            <option>KAMP</option>
            <option>KLUB</option>
            <option>UNGDOM</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Dato (vist tekst)</label>
          <input type="text" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="fx 12. marts 2026" className={inputCls} required />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.latest} onChange={(e) => setForm({ ...form, latest: e.target.checked })} className="w-4 h-4" />
            <span className="text-[10px] font-bold tracking-widest uppercase">Fremhæv (Latest)</span>
          </label>
        </div>
      </div>

      <div>
        <label className={labelCls}>Uddrag</label>
        <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} className={inputCls} required />
      </div>

      <div>
        <label className={labelCls}>Indhold</label>
        <TiptapEditor
          content={form.content}
          onChange={(html) => setForm((f) => ({ ...f, content: html }))}
        />
      </div>

      <div>
        <label className={labelCls}>Billede</label>
        <div className="flex items-center gap-3">
          <input type="text" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="URL..." className={`${inputCls} flex-1`} />
          <MediaPicker onSelect={(url) => setForm((f) => ({ ...f, image_url: url }))} />
        </div>
        {form.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.image_url} alt="" className="mt-2 h-32 w-auto object-cover border border-gray-200" />
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="text-xs font-bold tracking-widest uppercase bg-black text-white px-8 py-4 hover:bg-gray-900 transition-colors disabled:opacity-50">
          {loading ? "Gemmer..." : isEdit ? "GEM ÆNDRINGER" : "PUBLICÉR ARTIKEL"}
        </button>
        <button type="button" onClick={() => router.back()} className="text-xs font-bold tracking-widest uppercase border border-gray-300 px-8 py-4 hover:border-black transition-colors">
          Annullér
        </button>
      </div>
    </form>
  );
}
