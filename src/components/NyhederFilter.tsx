"use client";

import { useState } from "react";
import Link from "next/link";
import type { Article } from "@/lib/supabase";

type Tab = "ALLE" | "KAMP" | "KLUB" | "UNGDOM";
const tabs: Tab[] = ["ALLE", "KAMP", "KLUB", "UNGDOM"];

export default function NyhederFilter({ articles }: { articles: Article[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("ALLE");
  const filtered = activeTab === "ALLE" ? articles : articles.filter((a) => a.category === activeTab);

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

      {/* Articles grid */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((article) => (
            <Link
              key={article.id}
              href={`/nyheder/${article.slug}`}
              className="group block border border-[#e0dbd3] hover:border-black transition-colors duration-200"
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
                  <span className="text-[10px] text-[#8a847c]">{article.date}</span>
                </div>
                <h3 className="font-bold text-sm uppercase tracking-wide leading-snug mb-2 group-hover:underline">
                  {article.title}
                </h3>
                <p className="text-xs text-[#6b6560] leading-relaxed">{article.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
