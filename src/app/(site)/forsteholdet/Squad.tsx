import TruppenFilter from "@/components/TruppenFilter";
import { supabase } from "@/lib/supabase";
import type { Player } from "@/lib/supabase";
import { sortPlayersByNumber } from "@/lib/playerSort";

/** The squad grid. Streamed separately so it never holds up the sections above. */
export default async function Squad() {
  const { data } = await supabase.from("players").select("*").eq("status", "active");
  const players: Player[] = sortPlayersByNumber(data ?? [], "asc");

  return (
    <section id="truppen" className="py-16 md:py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-display text-4xl md:text-6xl leading-[0.9] mb-8">TRUPPEN</h2>
        <TruppenFilter players={players} />
      </div>
    </section>
  );
}
