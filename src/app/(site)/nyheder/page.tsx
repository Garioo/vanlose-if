import type { Metadata } from "next";
import NyhederFilter from "@/components/NyhederFilter";
import { supabase } from "@/lib/supabase";
import type { Article } from "@/lib/supabase";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Nyheder — Vanløse IF",
  description: "Seneste nyt fra Vanløse IF om kampe, klub og ungdomsfodbold.",
  path: "/nyheder",
});

export default async function NyhederPage() {
  const { data } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });

  const articles: Article[] = data ?? [];

  return (
    <div className="bg-white text-black min-h-screen pt-14">
      <section className="border-b border-gray-200 px-4 md:px-8 py-12 md:py-16 max-w-7xl mx-auto">
        <h1 className="font-display text-5xl md:text-7xl leading-[0.9] mb-3">NYHEDER</h1>
        <p className="text-sm text-gray-600 max-w-md">
          Seneste nyt fra Vanløse IF — kampe, klub og ungdomsfodbold.
        </p>
      </section>
      <NyhederFilter articles={articles} />
    </div>
  );
}
