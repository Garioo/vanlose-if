"use client";

import { useState, useEffect } from "react";
import type { Match } from "@/lib/supabase";

const SUGGESTIONS = ["kampe", "spillere", "ungdom", "træning", "events", "sponsorer"];

interface Props {
  folders: string[];
  selected: string;
  onSelect: (folder: string) => void;
  onCreate: (name: string) => Promise<void>;
  /** "row" = inline horizontal (medier page), "sidebar" = vertical list (MediaPicker) */
  layout?: "row" | "sidebar";
}

export default function FolderCreator({ folders, selected, onSelect, onCreate, layout = "row" }: Props) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    if (!showMatches || matches.length > 0) return;
    setLoadingMatches(true);
    fetch("/api/matches")
      .then((r) => r.json())
      .then((data: Match[]) => {
        // Show the 20 most recent finished/scheduled matches
        const sorted = Array.isArray(data)
          ? data.slice(0, 20)
          : [];
        setMatches(sorted);
      })
      .catch(() => {})
      .finally(() => setLoadingMatches(false));
  }, [showMatches, matches.length]);

  function matchFolderName(m: Match) {
    const date = m.kickoff_at
      ? new Date(m.kickoff_at).toISOString().slice(0, 10)
      : m.date;
    return `${date} ${m.home} vs ${m.away}`;
  }

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    await onCreate(trimmed);
    setName("");
    setCreating(false);
    setShowMatches(false);
    setSaving(false);
  }

  function cancel() {
    setCreating(false);
    setName("");
    setShowMatches(false);
  }

  const btnBase = "text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 border transition-colors";
  const activeBtn = `${btnBase} bg-black text-white border-black`;
  const inactiveBtn = `${btnBase} border-gray-300 text-gray-500 hover:border-black hover:text-black`;

  if (layout === "sidebar") {
    return (
      <div className="px-3 py-3 border-t border-gray-200">
        {creating ? (
          <div className="space-y-2">
            {/* Suggestions */}
            <div className="flex flex-wrap gap-1">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setName(s)}
                  className="text-[9px] font-bold tracking-widest uppercase border border-gray-200 px-1.5 py-0.5 hover:border-black hover:text-black text-gray-400 transition-colors">
                  {s}
                </button>
              ))}
            </div>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") cancel(); }}
              placeholder="Mappenavn"
              className="w-full border border-gray-300 px-2 py-1 text-[10px] focus:outline-none focus:border-black"
            />
            {/* Match picker toggle */}
            <button type="button" onClick={() => setShowMatches((v) => !v)}
              className="text-[9px] font-bold tracking-widest uppercase text-gray-400 hover:text-black transition-colors">
              {showMatches ? "▲ Skjul kampe" : "▼ Vælg kamp"}
            </button>
            {showMatches && (
              <div className="max-h-36 overflow-y-auto border border-gray-200 divide-y divide-gray-100">
                {loadingMatches ? (
                  <p className="text-[9px] text-gray-400 px-2 py-2">Henter...</p>
                ) : matches.length === 0 ? (
                  <p className="text-[9px] text-gray-400 px-2 py-2">Ingen kampe.</p>
                ) : matches.map((m) => (
                  <button key={m.id} type="button"
                    onClick={() => { setName(matchFolderName(m)); setShowMatches(false); }}
                    className="w-full text-left px-2 py-1.5 text-[9px] text-gray-600 hover:bg-gray-50 transition-colors">
                    {matchFolderName(m)}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <button type="button" onClick={handleCreate} disabled={saving || !name.trim()}
                className="flex-1 text-[9px] font-bold tracking-widest uppercase bg-black text-white py-1 hover:bg-gray-900 disabled:opacity-40 transition-colors">
                {saving ? "..." : "Opret"}
              </button>
              <button type="button" onClick={cancel}
                className="flex-1 text-[9px] font-bold tracking-widest uppercase border border-gray-300 py-1 hover:border-black transition-colors">
                Annullér
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setCreating(true)}
            className="w-full text-[9px] font-bold tracking-widest uppercase border border-gray-300 px-2 py-1.5 hover:border-black transition-colors">
            + Ny mappe
          </button>
        )}
      </div>
    );
  }

  // Row layout (medier page)
  return (
    <div>
      <label className="block text-[10px] font-bold tracking-widest uppercase mb-1 text-gray-600">Mappe</label>
      <div className="flex flex-wrap gap-1.5 items-center">
        <button type="button" onClick={() => onSelect("")} className={selected === "" ? activeBtn : inactiveBtn}>
          Rod
        </button>
        {folders.map((f) => (
          <button key={f} type="button" onClick={() => onSelect(f)} className={selected === f ? activeBtn : inactiveBtn}>
            {f}
          </button>
        ))}

        {creating ? (
          <div className="flex flex-wrap items-start gap-2 mt-1 w-full">
            {/* Predefined suggestions */}
            <div className="flex flex-wrap gap-1 w-full">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setName(s)}
                  className="text-[9px] font-bold tracking-widest uppercase border border-dashed border-gray-300 px-2 py-0.5 hover:border-black hover:text-black text-gray-400 transition-colors">
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") cancel(); }}
                placeholder="Mappenavn"
                className="border border-gray-300 px-2 py-1.5 text-[10px] w-44 focus:outline-none focus:border-black"
              />
              <button type="button" onClick={() => setShowMatches((v) => !v)}
                className="text-[10px] font-bold tracking-widest uppercase border border-gray-300 px-3 py-1.5 hover:border-black text-gray-500 transition-colors">
                ⚽ Vælg kamp
              </button>
              <button type="button" onClick={handleCreate} disabled={saving || !name.trim()}
                className="text-[10px] font-bold tracking-widest uppercase bg-black text-white px-3 py-1.5 hover:bg-gray-900 disabled:opacity-40 transition-colors">
                {saving ? "..." : "Opret"}
              </button>
              <button type="button" onClick={cancel}
                className="text-[10px] font-bold tracking-widest uppercase border border-gray-300 px-3 py-1.5 hover:border-black transition-colors">
                ✕
              </button>
            </div>

            {/* Match list */}
            {showMatches && (
              <div className="w-full border border-gray-200 max-h-48 overflow-y-auto divide-y divide-gray-100">
                {loadingMatches ? (
                  <p className="text-xs text-gray-400 px-3 py-2">Henter kampe...</p>
                ) : matches.length === 0 ? (
                  <p className="text-xs text-gray-400 px-3 py-2">Ingen kampe fundet.</p>
                ) : matches.map((m) => (
                  <button key={m.id} type="button"
                    onClick={() => { setName(matchFolderName(m)); setShowMatches(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                    {matchFolderName(m)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => setCreating(true)}
            className="text-[10px] font-bold tracking-widest uppercase border border-dashed border-gray-300 px-3 py-1.5 hover:border-black text-gray-400 hover:text-black transition-colors">
            + Ny mappe
          </button>
        )}
      </div>
      <p className="mt-1.5 text-[10px] text-gray-400 font-mono">
        vanlose-if/{selected || "rod"}
      </p>
    </div>
  );
}
