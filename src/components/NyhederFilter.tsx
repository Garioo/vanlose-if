"use client";

import { useState } from "react";
import Link from "next/link";
import type { Article } from "@/lib/supabase";
import { readingTime } from "@/lib/readingTime";

type Tab = "ALLE" | "KAMP" | "KLUB" | "UNGDOM";
const tabs: Tab[] = ["ALLE", "KAMP", "KLUB", "UNGDOM"];

function HeroCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/nyheder/${article.slug}`}
      className="group flex flex-col md:flex-row border border-[#e0dbd3] hover:border-black transition-colors duration-200 mb-6"
    >
      {/* Image — 60% on desktop */}
      <div className="md:w-[60%] aspect-video md:aspect-auto md:min-h-80 bg-[#edeae3] relative overflow-hidden shrink-0">
        {article.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-[#edeae3] to-[#ddd8d0] group-hover:from-[#ddd8d0] group-hover:to-[#ccc6bc] transition-colors duration-300" />
        )}
        {article.latest && (
          <span className="absolute top-4 left-4 bg-black text-white text-[10px] font-bold tracking-widest uppercase px-2 py-1">
            Seneste
          </span>
        )}
      </div>

      {/* Content — 40% on desktop */}
      <div className="flex flex-col justify-center p-6 md:p-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#6b6560]">
            {article.category}
          </span>
          <span className="text-[#e0dbd3]">·</span>
          <span className="text-[10px] text-[#8a847c]">{article.date}</span>
          <span className="text-[#e0dbd3]">·</span>
          <span className="text-[10px] text-[#8a847c]">{readingTime(article.content)} min</span>
        </div>
        <h2 className="font-display text-3xl md:text-5xl leading-[0.92] mb-4 group-hover:opacity-80 transition-opacity">
          {article.title}
        </h2>
        <p className="text-sm text-[#6b6560] leading-relaxed">{article.excerpt}</p>
        <span className="mt-6 inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-[#0d0d0b] group-hover:gap-3 transition-all duration-200">
          Læs artikel
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14m-7-7 7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

export default function NyhederFilter({ articles }: { articles: Article[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("ALLE");
  const filtered = activeTab === "ALLE" ? articles : articles.filter((a) => a.category === activeTab);
  const [hero, ...rest] = filtered;

  return (
    <>
      {/* Filter tabs */}
      <section className="border-b border-[#e0dbd3] px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex gap-1 py-3">
          {tabs.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`text-[10px] font-bold tracking-widest uppercase px-4 py-2 transition-colors ${
                activeTab === cat ? "bg-black text-white" : "text-[#8a847c] hover:text-black"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Articles */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Featured hero card */}
          {hero && <HeroCard article={hero} />}

          {/* Remaining articles grid */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {rest.map((article) => (
                <Link
                  key={article.id}
                  href={`/nyheder/${article.slug}`}
                  className="card-accent card-lift group block border border-[#e0dbd3] hover:border-black transition-colors duration-200"
                >
                  <div className="aspect-video bg-[#edeae3] relative overflow-hidden">
                    {article.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={article.image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="absolute inset-0 bg-linear-to-br from-[#edeae3] to-[#ddd8d0] group-hover:from-[#ddd8d0] group-hover:to-[#ccc6bc] transition-colors duration-300" />
                    )}
                    {article.latest && (
                      <span className="absolute top-3 left-3 bg-black text-white text-[10px] font-bold tracking-widest uppercase px-2 py-1">
                        Seneste
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-[#6b6560]">
                        {article.category}
                      </span>
                      <span className="text-[#e0dbd3]">·</span>
                      <span className="text-[10px] text-[#8a847c]">{article.date}</span>
                      <span className="text-[#e0dbd3]">·</span>
                      <span className="text-[10px] text-[#8a847c]">{readingTime(article.content)} min</span>
                    </div>
                    <h3 className="font-display text-2xl md:text-3xl leading-[0.92] mb-3 group-hover:opacity-80 transition-opacity">
                      {article.title}
                    </h3>
                    <p className="text-sm text-[#6b6560] leading-relaxed">{article.excerpt}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-[#0d0d0b] group-hover:gap-3 transition-all duration-200">
                      Læs artikel
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14m-7-7 7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <p className="text-sm text-[#8a847c]">Ingen artikler i denne kategori endnu.</p>
          )}
        </div>
      </section>
    </>
  );
}
