import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { Article } from "@/lib/supabase";
import DeleteButton from "./DeleteButton";

export default async function AdminNyhederPage() {
  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Admin</p>
          <h1 className="font-display text-3xl">NYHEDER</h1>
        </div>
        <Link
          href="/admin/nyheder/ny"
          className="text-xs font-bold tracking-widest uppercase bg-black text-white px-5 py-3 hover:bg-gray-900 transition-colors"
        >
          + NY ARTIKEL
        </Link>
      </div>

      <div className="bg-white border border-gray-200">
        {/* Table header — desktop only */}
        <div className="hidden md:grid grid-cols-12 text-[9px] font-bold tracking-widest uppercase text-gray-400 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <span className="col-span-1">Kat.</span>
          <span className="col-span-7">Titel</span>
          <span className="col-span-2">Dato</span>
          <span className="col-span-2 text-right">Handlinger</span>
        </div>

        {(articles as Article[])?.map((article) => (
          <div key={article.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
            {/* Mobile card */}
            <div className="md:hidden px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{article.category}</span>
                  <p className="text-xs font-bold uppercase tracking-wide truncate mt-0.5">{article.title}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-gray-400">{article.date}</span>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/nyheder/${article.id}`}
                    className="text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-black transition-colors"
                  >
                    Redigér
                  </Link>
                  <DeleteButton id={article.id} endpoint="articles" />
                </div>
              </div>
            </div>

            {/* Desktop row */}
            <div className="hidden md:grid grid-cols-12 items-center px-4 py-3">
              <span className="col-span-1 text-[10px] font-bold text-gray-400">{article.category}</span>
              <span className="col-span-7 text-xs font-bold uppercase tracking-wide truncate pr-4">
                {article.title}
              </span>
              <span className="col-span-2 text-[10px] text-gray-400">{article.date}</span>
              <div className="col-span-2 flex items-center justify-end gap-2">
                <Link
                  href={`/admin/nyheder/${article.id}`}
                  className="text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-black transition-colors"
                >
                  Redigér
                </Link>
                <DeleteButton id={article.id} endpoint="articles" />
              </div>
            </div>
          </div>
        ))}

        {(!articles || articles.length === 0) && (
          <div className="px-4 py-8 text-center text-xs text-gray-400">
            Ingen artikler endnu.{" "}
            <Link href="/admin/nyheder/ny" className="underline">Opret den første.</Link>
          </div>
        )}
      </div>
    </div>
  );
}
