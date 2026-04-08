import Link from "next/link";
import { supabase, type Article } from "@/lib/supabase";
import { readingTime } from "@/lib/readingTime";

export default async function News() {
  const { data } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3);

  const featured: Article[] = data ?? [];

  return (
    <section className="py-16 md:py-24 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10">
        <div>
          <h2 className="reveal font-display text-4xl md:text-6xl lg:text-7xl leading-[0.9] mb-3">
            Nyheder
          </h2>
          <p className="text-sm text-[#4a4540] max-w-md">
            Seneste nyt fra Vanløse IF – kampe, klub og ungdomsfodbold.
          </p>
        </div>
        <Link
          href="/nyheder"
          className="text-xs font-bold tracking-widest uppercase mt-4 md:mt-0 hover:underline flex items-center gap-1"
        >
          Alle nyheder
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14m-7-7 7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featured.map((article, i) => (
          <Link
            key={article.id}
            href={`/nyheder/${article.slug}`}
            className={`card-accent card-lift group block border border-[#e0dbd3] hover:border-black transition-colors duration-200 reveal reveal-delay-${i + 1}`}
          >
            <div className="aspect-video bg-[#edeae3] relative overflow-hidden">
              {article.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={article.image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="absolute inset-0 bg-linear-to-br from-[#ddd8d0] to-[#ccc6bc] group-hover:from-[#ccc6bc] group-hover:to-[#bbb5ab] transition-colors duration-300" />
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
    </section>
  );
}
