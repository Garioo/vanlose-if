"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { Player } from "@/lib/supabase";
import FolderCreator from "@/components/admin/FolderCreator";

const CldUploadWidget = dynamic(
  () => import("next-cloudinary").then((m) => m.CldUploadWidget),
  { ssr: false }
);

const POSITIONS: Player["position"][] = ["MÅLMÆND", "FORSVAR", "MIDTBANE", "ANGREB"];
const COMMON_TAGS = ["kampbillede", "holdfotos", "fejring", "træning", "portræt"];

interface MediaItem {
  public_id: string;
  url: string;
  tags: string[];
  created_at: string;
  bytes: number;
  filename: string;
  resource_type?: "image" | "video";
}

export default function AdminMedierPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Folder state
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");

  // Players for tag picker
  const [players, setPlayers] = useState<Player[]>([]);

  const cloudinaryFolder = selectedFolder ? `vanlose-if/${selectedFolder}` : "vanlose-if";

  const loadFolders = useCallback(async () => {
    const res = await fetch("/api/media/folders");
    const data = await res.json().catch(() => []);
    setFolders(Array.isArray(data) ? data : []);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeTag) params.set("tag", activeTag);
    if (selectedFolder) params.set("folder", selectedFolder);
    const res = await fetch(`/api/media?${params}`);
    const data = await res.json().catch(() => []);
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [activeTag, selectedFolder]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
      void loadFolders();
      void fetch("/api/players")
        .then((r) => r.json())
        .then((data: Player[]) => setPlayers(Array.isArray(data) ? data : []))
        .catch(() => {});
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load, loadFolders]);

  const allTags = Array.from(new Set(items.flatMap((i) => i.tags))).sort();

  async function handleCreateFolder(name: string) {
    const res = await fetch("/api/media/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const { name: created } = await res.json();
      setFolders((prev) => [...prev, created].sort());
      setSelectedFolder(created);
    }
  }

  async function handleCopy(item: MediaItem) {
    await navigator.clipboard.writeText(item.url);
    setCopiedId(item.public_id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function handleDelete(item: MediaItem) {
    if (!confirm(`Slet "${item.filename}" permanent?`)) return;
    await fetch(`/api/media/${encodeURIComponent(item.public_id)}`, { method: "DELETE" });
    load();
  }

  function startEditTags(item: MediaItem) {
    setEditingId(item.public_id);
    setEditTags([...item.tags]);
  }

  function toggleTag(tag: string) {
    const t = tag.toLowerCase().trim();
    setEditTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function saveTags(item: MediaItem) {
    await fetch(`/api/media/${encodeURIComponent(item.public_id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: editTags }),
    });
    setEditingId(null);
    load();
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const playersByPosition = POSITIONS.map((pos) => ({
    pos,
    players: players.filter((p) => p.position === pos),
  })).filter((g) => g.players.length > 0);

  return (
    <div>
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Admin</p>
        <h1 className="font-display text-3xl">MEDIEBIBLIOTEK</h1>
      </div>

      {/* Upload panel */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-xs font-bold tracking-widest uppercase mb-5">Upload medier</h2>
        <div className="flex flex-wrap items-end gap-6">
          <FolderCreator
            folders={folders}
            selected={selectedFolder}
            onSelect={setSelectedFolder}
            onCreate={handleCreateFolder}
            layout="row"
          />
          <CldUploadWidget
            key={cloudinaryFolder}
            signatureEndpoint="/api/media/sign"
            options={{ folder: cloudinaryFolder, resourceType: "auto", sources: ["local", "camera"], multiple: true, language: "da", useFilename: true, uniqueFilename: false }}
            onSuccess={() => load()}
          >
            {({ open }) => (
              <button
                onClick={() => open()}
                className="text-[10px] font-bold tracking-widest uppercase bg-black text-white px-6 py-2.5 hover:bg-gray-900 transition-colors mb-5"
              >
                ↑ Upload medier
              </button>
            )}
          </CldUploadWidget>
        </div>
      </div>

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTag(null)}
            className={["text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 border transition-colors", activeTag === null ? "bg-black text-white border-black" : "border-gray-300 text-gray-500 hover:border-black hover:text-black"].join(" ")}
          >
            Alle
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={["text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 border transition-colors", activeTag === tag ? "bg-black text-white border-black" : "border-gray-300 text-gray-500 hover:border-black hover:text-black"].join(" ")}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="text-xs text-gray-400 py-12 text-center">Henter medier...</div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-gray-200 px-6 py-12 text-center text-xs text-gray-400">
          {activeTag ? `Ingen medier med tagget "${activeTag}".` : "Ingen medier endnu. Upload det første ovenfor."}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => (
            <div key={item.public_id} className="bg-white border border-gray-200 overflow-hidden">
              <div className="relative aspect-4/3 overflow-hidden bg-gray-50">
                {item.resource_type === "video" ? (
                  <video
                    src={item.url}
                    className="h-full w-full object-cover"
                    controls
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <Image src={item.url} alt={item.filename} fill className="object-cover" sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                )}
              </div>

              <div className="px-3 py-2">
                <div className="flex items-center justify-between gap-1 mb-2">
                  <p className="text-[10px] text-gray-400 truncate flex-1" title={item.filename}>{item.filename}</p>
                  <span className="text-[9px] text-gray-300 shrink-0">{formatBytes(item.bytes)}</span>
                </div>

                {/* Tag editor */}
                {editingId === item.public_id ? (
                  <div className="mb-2 space-y-2">
                    {/* Current tags */}
                    <div className="flex flex-wrap gap-1 min-h-[18px]">
                      {editTags.length > 0 ? editTags.map((t) => (
                        <button key={t} type="button" onClick={() => toggleTag(t)}
                          className="text-[9px] font-bold tracking-widest uppercase bg-black text-white px-1.5 py-0.5 hover:bg-red-500 transition-colors">
                          {t} ✕
                        </button>
                      )) : <span className="text-[9px] text-gray-300">ingen tags valgt</span>}
                    </div>

                    {/* Common tags */}
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">Kategori</p>
                      <div className="flex flex-wrap gap-1">
                        {COMMON_TAGS.map((t) => (
                          <button key={t} type="button" onClick={() => toggleTag(t)}
                            className={["text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 border transition-colors", editTags.includes(t) ? "bg-black text-white border-black" : "border-gray-200 text-gray-400 hover:border-gray-400"].join(" ")}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Players by position */}
                    {playersByPosition.map(({ pos, players: posPlayers }) => (
                      <div key={pos}>
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">{pos}</p>
                        <div className="flex flex-wrap gap-1">
                          {posPlayers.map((p) => {
                            const tag = p.name.toLowerCase();
                            return (
                              <button key={p.id} type="button" onClick={() => toggleTag(tag)}
                                className={["text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 border transition-colors", editTags.includes(tag) ? "bg-black text-white border-black" : "border-gray-200 text-gray-400 hover:border-gray-400"].join(" ")}>
                                {p.number ? `#${p.number} ` : ""}{p.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-2 pt-1 border-t border-gray-100">
                      <button type="button" onClick={() => saveTags(item)} className="text-[9px] font-bold uppercase tracking-widest bg-black text-white px-3 py-1 hover:bg-gray-900 transition-colors">Gem</button>
                      <button type="button" onClick={() => setEditingId(null)} className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600">Annullér</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1 mb-2 min-h-[18px]">
                    {item.tags.length > 0 ? item.tags.map((tag) => (
                      <span key={tag} onClick={() => setActiveTag(tag)}
                        className="text-[9px] font-bold tracking-widest uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 cursor-pointer hover:bg-gray-200">
                        {tag}
                      </span>
                    )) : (
                      <span className="text-[9px] text-gray-300">ingen tags</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                {editingId !== item.public_id && (
                  <div className="flex gap-3 pt-1 border-t border-gray-100">
                    <button onClick={() => handleCopy(item)} className="text-[9px] font-bold tracking-widest uppercase text-gray-500 hover:text-black transition-colors">
                      {copiedId === item.public_id ? "Kopieret!" : "Kopier URL"}
                    </button>
                    <button onClick={() => startEditTags(item)} className="text-[9px] font-bold tracking-widest uppercase text-gray-500 hover:text-black transition-colors">
                      Tags
                    </button>
                    <button onClick={() => handleDelete(item)} className="text-[9px] font-bold tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors ml-auto">
                      Slet
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
