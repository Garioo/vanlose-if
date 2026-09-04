"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import FolderCreator from "@/components/admin/FolderCreator";
import TagFilterDropdown from "@/components/admin/TagFilterDropdown";
import { thumbnailUrl, videoPosterUrl, syncUploadedAsset } from "@/lib/media-url";

const CldUploadWidget = dynamic(
  () => import("next-cloudinary").then((m) => m.CldUploadWidget),
  { ssr: false }
);

interface MediaItem {
  public_id: string;
  url: string;
  tags: string[];
  filename: string;
  resource_type?: "image" | "video";
}

interface Props {
  onSelect: (url: string) => void;
  label?: string;
}

export default function MediaPicker({ onSelect, label = "Vælg billede" }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Folder state
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");

  const dialogRef = useRef<HTMLDivElement>(null);

  const cloudinaryFolder = selectedFolder
    ? `vanlose-if/${selectedFolder}`
    : "vanlose-if";
  const uploadWidgetSources: Array<"local" | "camera"> = ["local", "camera"];
  const uploadWidgetOptions = {
    folder: cloudinaryFolder,
    resourceType: "auto" as const,
    sources: uploadWidgetSources,
    multiple: false,
    useFilename: true,
    uniqueFilename: false,
  };

  const load = useCallback(async (tags?: string[], folder?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    for (const tag of tags ?? []) params.append("tag", tag);
    if (folder) params.set("folder", folder);
    const res = await fetch(`/api/media?${params}`);
    const data = await res.json().catch(() => []);
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  const loadFolders = useCallback(async () => {
    const res = await fetch("/api/media/folders");
    const data = await res.json().catch(() => []);
    setFolders(Array.isArray(data) ? data : []);
  }, []);

  // Full vocabulary, independent of the active folder/tag selection — otherwise
  // picking a folder hides every tag that has no media inside it.
  const loadTags = useCallback(async () => {
    const res = await fetch("/api/media/tags");
    const data = await res.json().catch(() => []);
    setAllTags(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    if (!open) return;

    const timeoutId = window.setTimeout(() => {
      void load(activeTags, selectedFolder);
      void loadFolders();
      void loadTags();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [open, activeTags, selectedFolder, load, loadFolders, loadTags]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  function select(url: string) {
    onSelect(url);
    setOpen(false);
  }

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

  // Counts describe the media currently loaded, so a tag showing 0 means
  // "not in this folder" rather than disappearing from the list entirely.
  const tagCounts = items.reduce<Record<string, number>>((acc, item) => {
    for (const tag of item.tags) acc[tag] = (acc[tag] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 text-[10px] font-bold tracking-widest uppercase border border-gray-300 px-3 py-2 hover:border-black transition-colors whitespace-nowrap"
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            ref={dialogRef}
            className="bg-white w-full max-w-5xl max-h-[85dvh] md:max-h-[90vh] flex flex-col md:flex-row shadow-2xl"
          >
            {/* Sidebar — folders */}
            <div className="md:w-48 md:shrink-0 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Mapper</p>
              </div>
              <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible md:flex-1 py-2 md:overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setSelectedFolder("")}
                  className={["shrink-0 md:w-full text-left px-4 py-2 text-[10px] font-bold tracking-wider uppercase transition-colors", selectedFolder === "" ? "bg-gray-100 text-black" : "text-gray-500 hover:text-black hover:bg-gray-50"].join(" ")}
                >
                  Alle billeder
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder}
                    type="button"
                    onClick={() => setSelectedFolder(folder)}
                    className={["shrink-0 md:w-full text-left px-4 py-2 text-[10px] font-bold tracking-wider uppercase transition-colors", selectedFolder === folder ? "bg-gray-100 text-black" : "text-gray-500 hover:text-black hover:bg-gray-50"].join(" ")}
                  >
                    {folder}
                  </button>
                ))}
              </div>
              <div className="hidden md:block">
                <FolderCreator
                  folders={folders}
                  selected={selectedFolder}
                  onSelect={setSelectedFolder}
                  onCreate={handleCreateFolder}
                  layout="sidebar"
                />
              </div>
            </div>

            {/* Main area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
                <h2 className="text-xs font-bold tracking-widest uppercase">
                  {selectedFolder || "Alle billeder"}
                </h2>
                <div className="flex items-center gap-2">
                  <CldUploadWidget
                    key={cloudinaryFolder}
                    signatureEndpoint="/api/media/sign"
                    options={uploadWidgetOptions}
                    onSuccess={async (result) => {
                      await syncUploadedAsset(result.info);
                      const info = result.info as { secure_url?: string } | undefined;
                      if (info?.secure_url) {
                        select(info.secure_url);
                      } else {
                        load(activeTags, selectedFolder);
                      }
                    }}
                  >
                    {({ open: openWidget }) => (
                      <button
                        type="button"
                        onClick={() => openWidget()}
                        className="text-[10px] font-bold tracking-widest uppercase bg-black text-white px-4 py-2 hover:bg-gray-900 transition-colors whitespace-nowrap"
                      >
                        ↑ Upload til {selectedFolder || "rod"}
                      </button>
                    )}
                  </CldUploadWidget>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-gray-400 hover:text-black text-lg leading-none ml-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Tag filter */}
              {allTags.length > 0 && (
                <div className="px-5 pt-3 border-b border-gray-100 shrink-0">
                  <TagFilterDropdown
                    allTags={allTags}
                    selected={activeTags}
                    onChange={setActiveTags}
                    counts={tagCounts}
                  />
                </div>
              )}

              {/* Grid */}
              <div className="overflow-y-auto p-4 flex-1">
                {loading ? (
                  <p className="text-xs text-gray-400 text-center py-12">Henter medier...</p>
                ) : items.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-12">Ingen medier i denne mappe.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {items.map((item) => (
                      <button
                        key={item.public_id}
                        type="button"
                        onClick={() => select(item.url)}
                        className="group relative aspect-square overflow-hidden border border-gray-200 hover:border-black transition-colors focus:outline-none focus:border-black"
                        title={item.filename}
                      >
                        {item.resource_type === "video" ? (
                          <video
                            src={item.url}
                            poster={videoPosterUrl(item.url, 300)}
                            className="h-full w-full object-cover group-hover:opacity-90 transition-opacity"
                            muted
                            playsInline
                            preload="none"
                          />
                        ) : (
                          <Image
                            src={thumbnailUrl(item.url, 300)}
                            alt={item.filename}
                            fill
                            unoptimized
                            className="object-cover group-hover:opacity-90 transition-opacity"
                            sizes="(max-width: 768px) 33vw, 20vw"
                          />
                        )}
                        {item.resource_type === "video" && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">▶</span>
                          </div>
                        )}
                        <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] truncate px-1 py-0.5 pointer-events-none">
                          {item.filename}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
