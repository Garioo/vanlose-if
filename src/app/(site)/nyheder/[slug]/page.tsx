import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import type { Article } from "@/lib/supabase";
import { buildArticleMetadata } from "@/lib/metadata";
import { readingTime } from "@/lib/readingTime";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase.from("articles").select("*").eq("slug", slug).single();
  if (!data) return {};
  return buildArticleMetadata({
    title: `${data.title} — Vanløse IF`,
    description: data.excerpt,
    path: `/nyheder/${slug}`,
    image: data.image_url,
    publishedTime: data.created_at,
  });
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .single<Article>();

  if (!article) notFound();

  const { data: related } = await supabase
    .from("articles")
    .select("*")
    .eq("category", article.category)
    .neq("slug", slug)
    .order("created_at", { ascending: false })
    .limit(3);

  const mins = readingTime(article.content);

  return (
    <div className="bg-[#f7f4ef] text-[#0d0d0b] min-h-screen pt-14">
      {/* Article hero */}
      <section className="border-b border-[#e0dbd3] px-4 md:px-8 py-12 md:py-20 max-w-3xl mx-auto">
        <Link
          href="/nyheder"
          className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-[#8a847c] hover:text-black transition-colors mb-8"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5m7 7-7-7 7-7" />
          </svg>
          Tilbage til nyheder
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#6b6560]">
            {article.category}
          </span>
          <span className="text-[10px] text-[#8a847c]">{article.date}</span>
          <span className="text-[10px] text-[#8a847c]">{mins} min læsning</span>
        </div>

        <h1 className="font-display text-4xl md:text-6xl leading-[0.9] mb-6">
          {article.title}
        </h1>

        <p className="text-base text-[#6b6560] leading-relaxed border-l-2 border-black pl-4">
          {article.excerpt}
        </p>
      </section>

      {/* Article body */}
      <article className="px-4 md:px-8 py-12 max-w-3xl mx-auto">
        {article.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full aspect-video object-cover mb-10"
          />
        )}
        {!article.image_url && <div className="aspect-video bg-[#edeae3] mb-10" />}

        <div className="prose-vif max-w-none">
          {article.content.split("\n\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </article>

      {/* Related articles */}
      {related && related.length > 0 && (
        <section className="px-4 md:px-8 py-12 border-t border-[#e0dbd3]">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-2xl mb-6">LÆS OGSÅ</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map((a: Article) => (
                <Link
                  key={a.id}
                  href={`/nyheder/${a.slug}`}
                  className="group border border-[#e0dbd3] hover:border-black transition-colors"
                >
                  <div className="aspect-video bg-[#edeae3] overflow-hidden">
                    {a.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.image_url}
                        alt={a.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#ddd8d0] to-[#ccc6bc]" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-[#6b6560]">
                        {a.category}
                      </span>
                      <span className="text-[10px] text-[#8a847c]">{a.date}</span>
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wide leading-snug group-hover:underline">
                      {a.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
