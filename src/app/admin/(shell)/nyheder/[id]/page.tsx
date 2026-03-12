import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import ArticleForm from "../ArticleForm";

export default async function RedigerArtikelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: article } = await supabase.from("articles").select("*").eq("id", id).single();

  if (!article) notFound();

  return (
    <div>
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">
          Nyheder
        </p>
        <h1 className="font-display text-3xl">REDIGÉR ARTIKEL</h1>
      </div>
      <ArticleForm article={article} />
    </div>
  );
}
