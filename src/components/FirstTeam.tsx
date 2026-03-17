import Image from "next/image";
import Link from "next/link";
import type { Player } from "@/lib/supabase";

type FirstTeamProps = {
  players: Player[];
};

export default function FirstTeam({ players }: FirstTeamProps) {
  return (
    <section className="py-16 md:py-24 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10">
        <div>
          <h2 className="reveal font-display text-4xl md:text-6xl lg:text-7xl leading-[0.9] mb-3">
            Førsteholdet
          </h2>
          <p className="text-sm text-[#4a4540] max-w-md">
            Vores flagskib kæmper for oprykning. Mød profilerne og se de nyeste resultater fra 3. Division.
          </p>
        </div>
        <Link
          href="/forsteholdet"
          className="text-xs font-bold tracking-widest uppercase mt-4 md:mt-0 hover:underline flex items-center gap-1"
        >
          Se Truppen
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14m-7-7 7 7-7 7" />
          </svg>
        </Link>
      </div>

      {players.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {players.map((player, i) => (
            <div key={player.id} className={`group cursor-pointer reveal reveal-delay-${Math.min(i + 1, 4)}`}>
              <div className="relative aspect-3/4 bg-[#edeae3] overflow-hidden mb-3">
                <Image
                  src={player.image_url || "/images/player-placeholder.png"}
                  alt={player.name}
                  fill
                  className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                />
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-3xl md:text-4xl text-[#c5bfb6]">{player.number}</span>
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wide">{player.name}</h3>
                  <p className="text-xs text-[#6b6560] uppercase tracking-wider">{player.position}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-[#e0dbd3] p-6 text-sm text-[#4a4540]">
          Truppen bliver offentliggjort her, så snart spillerlisten er opdateret.
        </div>
      )}
    </section>
  );
}
