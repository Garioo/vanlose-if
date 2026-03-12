import ArticleForm from "../ArticleForm";

export default function NyArtikelPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">
          Nyheder
        </p>
        <h1 className="font-display text-3xl">NY ARTIKEL</h1>
      </div>
      <ArticleForm />
    </div>
  );
}
