"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

type SaveState = "idle" | "saving" | "saved" | "error";

function normalizeTag(tag: string) {
  return tag.toLowerCase().trim();
}

function sortTags(tags: string[]) {
  return [...tags].sort((a, b) => a.localeCompare(b, "da"));
}

function sameTags(a: string[], b: string[]) {
  const left = sortTags(a);
  const right = sortTags(b);
  return left.length === right.length && left.every((tag, index) => tag === right[index]);
}

export default function AdminMedierPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isTagPanelOpen, setIsTagPanelOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState("");
  const [draftTagsById, setDraftTagsById] = useState<Record<string, string[]>>({});
  const [saveStateById, setSaveStateById] = useState<Record<string, SaveState>>({});
  const [saveErrorById, setSaveErrorById] = useState<Record<string, string | null>>({});
  const [expandedPositions, setExpandedPositions] = useState<Player["position"][]>([]);

  // Folder state
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");

  // Players for tag picker
  const [players, setPlayers] = useState<Player[]>([]);

  const cloudinaryFolder = selectedFolder ? `vanlose-if/${selectedFolder}` : "vanlose-if";
  const uploadWidgetSources: Array<"local" | "camera"> = ["local", "camera"];
  const uploadWidgetOptions = {
    folder: cloudinaryFolder,
    resourceType: "auto" as const,
    sources: uploadWidgetSources,
    multiple: true,
    language: "da",
    useFilename: true,
    uniqueFilename: false,
  };

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

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => items.some((item) => item.public_id === id)));
  }, [items]);

  useEffect(() => {
    if (selectedIds.length === 0) {
      setIsTagPanelOpen(false);
      setActiveQueueId(null);
      setTagSearch("");
      return;
    }

    if (!activeQueueId || !selectedIds.includes(activeQueueId)) {
      setActiveQueueId(selectedIds[0]);
    }
  }, [selectedIds, activeQueueId]);

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

  async function handleBulkDelete() {
    if (!confirm(`Slet ${selectedIds.length} medier permanent?`)) return;
    setDeleting(true);
    for (const id of selectedIds) {
      await fetch(`/api/media/${encodeURIComponent(id)}`, { method: "DELETE" });
    }
    setSelectedIds([]);
    closeTagPanel();
    await load();
    setDeleting(false);
  }

  async function handleDelete(item: MediaItem) {
    if (!confirm(`Slet "${item.filename}" permanent?`)) return;
    await fetch(`/api/media/${encodeURIComponent(item.public_id)}`, { method: "DELETE" });
    setSelectedIds((prev) => prev.filter((id) => id !== item.public_id));
    load();
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((prev) =>
      checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((value) => value !== id)
    );
  }

  function initializeDrafts(ids: string[]) {
    const nextDrafts: Record<string, string[]> = {};
    const nextStates: Record<string, SaveState> = {};
    const nextErrors: Record<string, string | null> = {};

    ids.forEach((id) => {
      const item = items.find((entry) => entry.public_id === id);
      if (!item) return;
      nextDrafts[id] = [...item.tags];
      nextStates[id] = "idle";
      nextErrors[id] = null;
    });

    setDraftTagsById(nextDrafts);
    setSaveStateById(nextStates);
    setSaveErrorById(nextErrors);
  }

  function openTagPanel() {
    if (selectedIds.length === 0) return;
    openTagPanelForIds(selectedIds);
  }

  function openTagPanelForIds(ids: string[]) {
    if (ids.length === 0) return;
    initializeDrafts(ids);
    setSelectedIds(ids);
    setActiveQueueId(ids[0]);
    setTagSearch("");
    setExpandedPositions([]);
    setIsTagPanelOpen(true);
  }

  function closeTagPanel() {
    setIsTagPanelOpen(false);
    setTagSearch("");
    setDraftTagsById({});
    setSaveStateById({});
    setSaveErrorById({});
    setExpandedPositions([]);
  }

  function toggleDraftTag(id: string, tag: string) {
    const normalized = normalizeTag(tag);
    setDraftTagsById((prev) => {
      const current = prev[id] ?? items.find((item) => item.public_id === id)?.tags ?? [];
      return {
        ...prev,
        [id]: current.includes(normalized)
          ? current.filter((value) => value !== normalized)
          : [...current, normalized],
      };
    });
    setSaveStateById((prev) => ({ ...prev, [id]: "idle" }));
    setSaveErrorById((prev) => ({ ...prev, [id]: null }));
  }

  function selectQueueItem(id: string) {
    setActiveQueueId(id);
    setTagSearch("");
  }

  function updateItemsAfterSave(id: string, tags: string[]) {
    setItems((prev) =>
      prev.map((item) => (item.public_id === id ? { ...item, tags: sortTags(tags) } : item))
    );
  }

  async function saveTags(id: string) {
    const draftTags = sortTags(draftTagsById[id] ?? items.find((item) => item.public_id === id)?.tags ?? []);

    setSaveStateById((prev) => ({ ...prev, [id]: "saving" }));
    setSaveErrorById((prev) => ({ ...prev, [id]: null }));

    try {
      const res = await fetch(`/api/media/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: draftTags }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Kunne ikke gemme tags");
      }

      updateItemsAfterSave(id, draftTags);
      setDraftTagsById((prev) => ({ ...prev, [id]: draftTags }));
      setSaveStateById((prev) => ({ ...prev, [id]: "saved" }));
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunne ikke gemme tags";
      setSaveStateById((prev) => ({ ...prev, [id]: "error" }));
      setSaveErrorById((prev) => ({ ...prev, [id]: message }));
      return false;
    }
  }

  async function saveAndMove(direction: 1 | -1) {
    if (!activeQueueId) return;

    const saved = await saveTags(activeQueueId);
    if (!saved) return;

    const nextIndex = selectedIds.indexOf(activeQueueId) + direction;
    if (nextIndex >= 0 && nextIndex < selectedIds.length) {
      setActiveQueueId(selectedIds[nextIndex]);
      setTagSearch("");
    }
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const playersByPosition = useMemo(
    () =>
      POSITIONS.map((pos) => ({
        pos,
        players: players.filter((p) => p.position === pos),
      })).filter((g) => g.players.length > 0),
    [players]
  );

  const allVisibleSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.public_id));
  const selectedItems = selectedIds
    .map((id) => items.find((item) => item.public_id === id))
    .filter((item): item is MediaItem => Boolean(item));
  const activeItem = selectedItems.find((item) => item.public_id === activeQueueId) ?? null;
  const activeDraftTags = activeItem ? draftTagsById[activeItem.public_id] ?? activeItem.tags : [];
  const activeIndex = activeItem ? selectedIds.indexOf(activeItem.public_id) : -1;
  const activeSearch = normalizeTag(tagSearch);
  const matchingCommonTags = activeSearch
    ? COMMON_TAGS.filter((tag) => normalizeTag(tag).includes(activeSearch))
    : COMMON_TAGS;
  const matchingPlayers = activeSearch
    ? players.filter((player) => normalizeTag(player.name).includes(activeSearch))
    : [];

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
            options={uploadWidgetOptions}
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

      {items.length > 0 && (
        <div className="mb-4 bg-white border border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={(e) =>
                setSelectedIds(e.target.checked ? items.map((item) => item.public_id) : [])
              }
            />
            Vælg alle på siden
          </label>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {selectedIds.length} valgt
          </span>
          <button
            type="button"
            onClick={openTagPanel}
            disabled={selectedIds.length === 0}
            className="text-[10px] font-bold tracking-widest uppercase bg-black text-white px-4 py-2 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
          >
            Rediger tags
          </button>
          {selectedIds.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => void handleBulkDelete()}
                disabled={deleting}
                className="text-[10px] font-bold tracking-widest uppercase text-red-500 hover:text-red-700 disabled:text-gray-300 transition-colors"
              >
                {deleting ? "Sletter..." : `Slet valgte (${selectedIds.length})`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedIds([]);
                  closeTagPanel();
                }}
                className="text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-black transition-colors"
              >
                Ryd valg
              </button>
            </>
          )}
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
        <div className={isTagPanelOpen ? "grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]" : ""}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.public_id);
              return (
                <div
                  key={item.public_id}
                  className={[
                    "bg-white border overflow-hidden transition-colors",
                    isSelected ? "border-black shadow-[0_0_0_1px_rgba(0,0,0,1)]" : "border-gray-200",
                  ].join(" ")}
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-gray-50">
                    <label className="absolute left-2 top-2 z-10 inline-flex items-center gap-2 rounded-full bg-white/90 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-black shadow-sm">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelected(item.public_id, e.target.checked)}
                      />
                      Vælg
                    </label>
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
                      <p className="text-[10px] text-gray-500 truncate flex-1" title={item.filename}>{item.filename}</p>
                      <span className="text-[9px] text-gray-300 shrink-0">{formatBytes(item.bytes)}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 min-h-[22px] mb-2">
                      {item.tags.length > 0 ? item.tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setActiveTag(tag)}
                          className="text-[9px] font-bold tracking-widest uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 hover:bg-gray-200 transition-colors"
                        >
                          {tag}
                        </button>
                      )) : (
                        <span className="text-[9px] text-gray-300">ingen tags</span>
                      )}
                    </div>

                    <div className="flex gap-3 pt-1 border-t border-gray-100">
                      <button onClick={() => handleCopy(item)} className="text-[9px] font-bold tracking-widest uppercase text-gray-500 hover:text-black transition-colors">
                        {copiedId === item.public_id ? "Kopieret!" : "Kopier URL"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openTagPanelForIds([item.public_id])}
                        className="text-[9px] font-bold tracking-widest uppercase text-gray-500 hover:text-black transition-colors"
                      >
                        Tags
                      </button>
                      <button onClick={() => handleDelete(item)} className="text-[9px] font-bold tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors ml-auto">
                        Slet
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {isTagPanelOpen && activeItem && (
            <aside className="bg-[#f5f1e8] border border-black p-4 xl:sticky xl:top-4 h-fit space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500">Tag queue</p>
                  <h2 className="font-display text-2xl leading-none mt-1">Rediger valg</h2>
                </div>
                <button
                  type="button"
                  onClick={closeTagPanel}
                  className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
                >
                  Luk
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {selectedItems.map((item) => {
                  const draft = draftTagsById[item.public_id] ?? item.tags;
                  const state = saveStateById[item.public_id] ?? "idle";
                  const dirty = !sameTags(draft, item.tags);
                  return (
                    <button
                      key={item.public_id}
                      type="button"
                      onClick={() => selectQueueItem(item.public_id)}
                      className={[
                        "min-w-[74px] border p-1.5 text-left transition-colors",
                        item.public_id === activeItem.public_id ? "border-black bg-white" : "border-black/20 bg-white/70 hover:bg-white",
                      ].join(" ")}
                    >
                      <div className="relative h-14 w-full overflow-hidden bg-gray-100 mb-1">
                        {item.resource_type === "video" ? (
                          <video src={item.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                        ) : (
                          <Image src={item.url} alt={item.filename} fill className="object-cover" sizes="74px" />
                        )}
                      </div>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-gray-600 truncate">
                        {item.filename}
                      </p>
                      <p className="text-[8px] uppercase tracking-widest text-gray-400 mt-0.5">
                        {state === "saving" ? "gemmer" : state === "saved" ? "gemt" : state === "error" ? "fejl" : dirty ? "kladde" : "klar"}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="bg-white border border-black/15 p-3">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      {activeIndex + 1} / {selectedItems.length}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wide truncate max-w-[14rem]" title={activeItem.filename}>
                      {activeItem.filename}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => activeIndex > 0 && setActiveQueueId(selectedIds[activeIndex - 1])}
                      disabled={activeIndex <= 0}
                      className="border border-gray-300 px-2 py-1 text-[9px] font-bold uppercase tracking-widest disabled:opacity-40"
                    >
                      Forrige
                    </button>
                    <button
                      type="button"
                      onClick={() => activeIndex < selectedItems.length - 1 && setActiveQueueId(selectedIds[activeIndex + 1])}
                      disabled={activeIndex >= selectedItems.length - 1}
                      className="border border-gray-300 px-2 py-1 text-[9px] font-bold uppercase tracking-widest disabled:opacity-40"
                    >
                      Næste
                    </button>
                  </div>
                </div>

                <div className="relative aspect-4/3 overflow-hidden bg-gray-100 border border-gray-200 mb-3">
                  {activeItem.resource_type === "video" ? (
                    <video src={activeItem.url} className="h-full w-full object-cover" controls muted playsInline preload="metadata" />
                  ) : (
                    <Image src={activeItem.url} alt={activeItem.filename} fill className="object-cover" sizes="352px" />
                  )}
                </div>

                <div className="mb-3">
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Valgte tags</p>
                  <div className="flex flex-wrap gap-1 min-h-[26px]">
                    {activeDraftTags.length > 0 ? sortTags(activeDraftTags).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleDraftTag(activeItem.public_id, tag)}
                        className="text-[9px] font-bold tracking-widest uppercase bg-black text-white px-2 py-1 hover:bg-red-500 transition-colors"
                      >
                        {tag} ×
                      </button>
                    )) : (
                      <span className="text-[9px] text-gray-300">ingen tags valgt</span>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-[9px] uppercase tracking-widest text-gray-400 mb-1" htmlFor="tag-search">
                    Søg tags
                  </label>
                  <input
                    id="tag-search"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder="Spiller eller kategori"
                    className="w-full border border-gray-300 px-3 py-2 text-xs bg-white outline-none focus:border-black"
                  />
                </div>

                <div className="space-y-3 max-h-[22rem] overflow-y-auto pr-1">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Kategorier</p>
                    <div className="flex flex-wrap gap-1">
                      {matchingCommonTags.map((tag) => {
                        const selected = activeDraftTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleDraftTag(activeItem.public_id, tag)}
                            className={[
                              "text-[9px] font-bold tracking-widest uppercase px-2 py-1 border transition-colors",
                              selected ? "bg-black text-white border-black" : "border-gray-300 text-gray-500 hover:border-black hover:text-black",
                            ].join(" ")}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {activeSearch ? (
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Spillere</p>
                      <div className="flex flex-wrap gap-1">
                        {matchingPlayers.length > 0 ? matchingPlayers.map((player) => {
                          const tag = normalizeTag(player.name);
                          const selected = activeDraftTags.includes(tag);
                          return (
                            <button
                              key={player.id}
                              type="button"
                              onClick={() => toggleDraftTag(activeItem.public_id, tag)}
                              className={[
                                "text-[9px] font-bold tracking-widest uppercase px-2 py-1 border transition-colors",
                                selected ? "bg-black text-white border-black" : "border-gray-300 text-gray-500 hover:border-black hover:text-black",
                              ].join(" ")}
                            >
                              {player.number ? `#${player.number} ` : ""}{player.name}
                            </button>
                          );
                        }) : (
                          <p className="text-[9px] text-gray-300">Ingen spillere matcher søgningen.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    playersByPosition.map(({ pos, players: posPlayers }) => {
                      const expanded = expandedPositions.includes(pos);
                      return (
                        <div key={pos} className="border border-gray-200 bg-gray-50">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedPositions((prev) =>
                                prev.includes(pos) ? prev.filter((value) => value !== pos) : [...prev, pos]
                              )
                            }
                            className="w-full flex items-center justify-between px-3 py-2 text-left"
                          >
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{pos}</span>
                            <span className="text-[9px] text-gray-400">{expanded ? "−" : "+"}</span>
                          </button>
                          {expanded && (
                            <div className="px-3 pb-3 flex flex-wrap gap-1">
                              {posPlayers.map((player) => {
                                const tag = normalizeTag(player.name);
                                const selected = activeDraftTags.includes(tag);
                                return (
                                  <button
                                    key={player.id}
                                    type="button"
                                    onClick={() => toggleDraftTag(activeItem.public_id, tag)}
                                    className={[
                                      "text-[9px] font-bold tracking-widest uppercase px-2 py-1 border transition-colors",
                                      selected ? "bg-black text-white border-black" : "border-gray-300 text-gray-500 hover:border-black hover:text-black",
                                    ].join(" ")}
                                  >
                                    {player.number ? `#${player.number} ` : ""}{player.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {saveErrorById[activeItem.public_id] && (
                  <p className="text-[10px] text-red-500 mt-3">{saveErrorById[activeItem.public_id]}</p>
                )}

                <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => saveTags(activeItem.public_id)}
                    disabled={saveStateById[activeItem.public_id] === "saving"}
                    className="text-[9px] font-bold uppercase tracking-widest bg-black text-white px-3 py-2 hover:bg-gray-900 transition-colors disabled:bg-gray-300"
                  >
                    {saveStateById[activeItem.public_id] === "saving" ? "Gemmer..." : "Gem"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveAndMove(1)}
                    disabled={saveStateById[activeItem.public_id] === "saving" || activeIndex >= selectedItems.length - 1}
                    className="text-[9px] font-bold uppercase tracking-widest border border-black px-3 py-2 disabled:opacity-40"
                  >
                    Gem & næste
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftTagsById((prev) => ({ ...prev, [activeItem.public_id]: [...activeItem.tags] }));
                      setSaveStateById((prev) => ({ ...prev, [activeItem.public_id]: "idle" }));
                      setSaveErrorById((prev) => ({ ...prev, [activeItem.public_id]: null }));
                    }}
                    className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                  >
                    Nulstil
                  </button>
                </div>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
