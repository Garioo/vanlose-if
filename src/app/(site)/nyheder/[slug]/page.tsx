import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import type { Article } from "@/lib/supabase";
import { buildArticleMetadata } from "@/lib/metadata";

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

  const { data: more } = await supabase
    .from("articles")
    .select("*")
    .neq("slug", slug)
    .order("created_at", { ascending: false })
    .limit(2);

  return (
    <div className="bg-white text-black min-h-screen pt-14">
      {/* Article hero */}
      <section className="border-b border-gray-200 px-4 md:px-8 py-12 md:py-20 max-w-3xl mx-auto">
        <Link
          href="/nyheder"
          className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-black transition-colors mb-8"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5m7 7-7-7 7-7" />
          </svg>
          Tilbage til nyheder
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
            {article.category}
          </span>
          <span className="text-[10px] text-gray-400">{article.date}</span>
        </div>

        <h1 className="font-display text-4xl md:text-6xl leading-[0.9] mb-6">
          {article.title}
        </h1>

        <p className="text-base text-gray-500 leading-relaxed border-l-2 border-black pl-4">
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
        {!article.image_url && <div className="aspect-video bg-gray-100 mb-10" />}

        <div className="prose prose-sm max-w-none space-y-4">
          {article.content.split("\n\n").map((paragraph, i) => (
            <p key={i} className="text-sm text-gray-700 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      {/* More articles */}
      {more && more.length > 0 && (
        <section className="px-4 md:px-8 py-12 border-t border-gray-200">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-2xl mb-6">FLERE NYHEDER</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {more.map((a: Article) => (
                <Link
                  key={a.id}
                  href={`/nyheder/${a.slug}`}
                  className="group border border-gray-200 hover:border-black transition-colors p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
                      {a.category}
                    </span>
                    <span className="text-[10px] text-gray-300">{a.date}</span>
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wide leading-snug group-hover:underline">
                    {a.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
