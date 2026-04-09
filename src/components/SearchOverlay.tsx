"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { Article, Player, Match } from "@/lib/supabase";

interface SearchOverlayProps {
  onClose: () => void;
}

export default function SearchOverlay({ onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/articles").then((r) => r.json()).catch(() => []),
      fetch("/api/players").then((r) => r.json()).catch(() => []),
      fetch("/api/matches").then((r) => r.json()).catch(() => []),
    ]).then(([articles, players, matches]) => {
      if (Array.isArray(articles)) setAllArticles(articles as Article[]);
      if (Array.isArray(players)) setAllPlayers(players as Player[]);
      if (Array.isArray(matches)) setAllMatches(matches as Match[]);
    });
  }, []);

  const q = query.trim().toLowerCase();

  const articleHits = q.length === 0
    ? []
    : allArticles.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );

  const playerHits = q.length === 0
    ? []
    : allPlayers.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q) ||
        (p.number && String(p.number).includes(q))
      );

  const matchHits = q.length === 0
    ? []
    : allMatches.filter((m) =>
        m.home.toLowerCase().includes(q) ||
        m.away.toLowerCase().includes(q) ||
        m.date.toLowerCase().includes(q)
      );

  const hasResults = articleHits.length > 0 || playerHits.length > 0 || matchHits.length > 0;

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ArrowIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#8a847c] shrink-0 mt-1">
      <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
  );

  return (
    <div
      className="fixed inset-0 z-100 bg-[#f7f4ef]/97 backdrop-blur-sm flex flex-col"
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
          placeholder="Søg i nyheder, spillere og kampe..."
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
        {q.length === 0 && (
          <p className="text-xs text-[#8a847c] uppercase tracking-widest">
            Søg i nyheder, spillere og kampe
          </p>
        )}

        {q.length > 0 && !hasResults && (
          <p className="text-xs text-[#8a847c] uppercase tracking-widest">
            Ingen resultater for &ldquo;{query}&rdquo;
          </p>
        )}

        {/* Articles */}
        {articleHits.length > 0 && (
          <div className="mb-8">
            <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[#8a847c] mb-3">Nyheder</p>
            <div className="divide-y divide-[#e0dbd3]">
              {articleHits.map((article) => (
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
                  <ArrowIcon />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Players */}
        {playerHits.length > 0 && (
          <div className="mb-8">
            <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[#8a847c] mb-3">Spillere</p>
            <div className="divide-y divide-[#e0dbd3]">
              {playerHits.map((player) => (
                <Link
                  key={player.id}
                  href="/forsteholdet"
                  onClick={onClose}
                  className="flex items-center justify-between py-4 gap-6 group hover:bg-[#edeae3] -mx-2 px-2 transition-colors"
                >
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide group-hover:underline">
                      {player.name}
                    </h3>
                    <p className="text-[10px] text-[#8a847c] mt-0.5 uppercase tracking-widest">
                      {player.position}{player.number ? ` · #${player.number}` : ""}
                    </p>
                  </div>
                  <ArrowIcon />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Matches */}
        {matchHits.length > 0 && (
          <div className="mb-8">
            <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[#8a847c] mb-3">Kampe</p>
            <div className="divide-y divide-[#e0dbd3]">
              {matchHits.map((match) => (
                <Link
                  key={match.id}
                  href={`/kampe/${match.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between py-4 gap-6 group hover:bg-[#edeae3] -mx-2 px-2 transition-colors"
                >
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide group-hover:underline">
                      {match.home} vs {match.away}
                    </h3>
                    <p className="text-[10px] text-[#8a847c] mt-0.5 uppercase tracking-widest">
                      {match.date}{match.time ? ` · ${match.time}` : ""} · {match.status === "live" ? "LIVE" : match.status === "finished" ? "SLUT" : "KOMMENDE"}
                    </p>
                  </div>
                  <ArrowIcon />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
