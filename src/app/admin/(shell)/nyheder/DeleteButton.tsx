"use client";

import { useRouter } from "next/navigation";

export default function DeleteButton({ id, endpoint }: { id: string; endpoint: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Er du sikker på, at du vil slette dette?")) return;
    const res = await fetch(`/api/${endpoint}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Kunne ikke slette. Prøv igen.");
      return;
    }
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="text-[10px] font-bold tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors"
    >
      Slet
    </button>
  );
}
