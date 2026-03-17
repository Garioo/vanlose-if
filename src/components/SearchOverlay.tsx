"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { Article } from "@/lib/supabase";

interface SearchOverlayProps {
  onClose: () => void;
}

export default function SearchOverlay({ onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/articles")
      .then((r) => r.json())
      .then((data: Article[]) => setAllArticles(data))
      .catch(() => {});
  }, []);

  const results = query.trim().length === 0
    ? []
    : allArticles.filter((a) =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.excerpt.toLowerCase().includes(query.toLowerCase()) ||
        a.category.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#f7f4ef]/97 backdrop-blur-sm flex flex-col"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Search input bar */}
      <div className="border-b border-[#e0dbd3] px-4 md:px-8 py-4 flex items-center gap-4 max-w-7xl mx-auto w-full">
        <Search size={18} className="text-[#8a847c] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Søg i nyheder..."
          className="flex-1 text-sm md:text-base font-bold uppercase tracking-wide bg-transparent focus:outline-none placeholder:text-[#8a847c] placeholder:normal-case placeholder:font-normal"
        />
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#edeae3] rounded transition-colors"
          aria-label="Luk søgning"
        >
          <X size={18} />
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 max-w-7xl mx-auto w-full">
        {query.trim().length === 0 && (
          <p className="text-xs text-[#8a847c] uppercase tracking-widest">
            Skriv for at søge i alle nyheder
          </p>
        )}

        {query.trim().length > 0 && results.length === 0 && (
          <p className="text-xs text-[#8a847c] uppercase tracking-widest">
            Ingen resultater for &ldquo;{query}&rdquo;
          </p>
        )}

        {results.length > 0 && (
          <div className="divide-y divide-[#e0dbd3]">
            {results.map((article) => (
              <Link
                key={article.id}
                href={`/nyheder/${article.slug}`}
                onClick={onClose}
                className="flex items-start justify-between py-5 gap-6 group hover:bg-[#edeae3] -mx-2 px-2 transition-colors"
              >
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#8a847c] mb-1">
                    {article.category} · {article.date}
                  </p>
                  <h3 className="text-sm font-bold uppercase tracking-wide group-hover:underline">
                    {article.title}
                  </h3>
                  <p className="text-xs text-[#6b6560] mt-1 leading-relaxed line-clamp-1">
                    {article.excerpt}
                  </p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#8a847c] shrink-0 mt-1">
                  <path d="M5 12h14m-7-7 7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
