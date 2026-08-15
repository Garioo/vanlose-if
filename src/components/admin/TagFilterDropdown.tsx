"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  /** Full tag vocabulary — must not depend on the current filter. */
  allTags: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
  /** How many currently loaded items carry each tag. Optional. */
  counts?: Record<string, number>;
}

export default function TagFilterDropdown({ allTags, selected, onChange, counts }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  function close() {
    setOpen(false);
    setSearch("");
  }

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) close();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const filteredTags = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allTags;
    return allTags.filter((tag) => tag.toLowerCase().includes(q));
  }, [allTags, search]);

  function toggle(tag: string) {
    onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag]);
  }

  if (allTags.length === 0) return null;

  return (
    <div ref={containerRef} className="relative mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => (open ? close() : setOpen(true))}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase px-3 py-2 border border-gray-300 text-gray-600 hover:border-black hover:text-black transition-colors"
        >
          {selected.length === 0 ? "Filtrér efter tag" : `${selected.length} tag valgt`}
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {selected.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-2 bg-black text-white"
          >
            {tag}
            <button
              type="button"
              onClick={() => toggle(tag)}
              aria-label={`Fjern tag ${tag}`}
              className="hover:text-gray-300 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}

        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] font-bold tracking-widest uppercase px-2 py-2 text-gray-400 hover:text-black transition-colors"
          >
            Ryd alle
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white border border-gray-300 shadow-lg">
          <div className="p-2 border-b border-gray-200">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Søg efter tag..."
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filteredTags.length === 0 ? (
              <p className="px-3 py-4 text-[10px] text-gray-400 text-center uppercase tracking-widest">
                Ingen tags matcher
              </p>
            ) : (
              filteredTags.map((tag) => {
                const isSelected = selected.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggle(tag)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span
                      className={`w-4 h-4 border flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-black border-black" : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                    <span className="text-sm text-gray-800 truncate flex-1">{tag}</span>
                    {counts?.[tag] != null && (
                      <span className="text-[10px] text-gray-400 tabular-nums shrink-0">{counts[tag]}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
