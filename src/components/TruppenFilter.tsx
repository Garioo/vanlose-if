"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Player } from "@/lib/supabase";
import { sortPlayersByNumber } from "@/lib/playerSort";

type Position = "ALLE" | "MÅLMÆND" | "FORSVAR" | "MIDTBANE" | "ANGREB";
const tabs: Position[] = ["ALLE", "MÅLMÆND", "FORSVAR", "MIDTBANE", "ANGREB"];

export default function TruppenFilter({ players }: { players: Player[] }) {
  const [activeTab, setActiveTab] = useState<Position>("ALLE");

  const sortedPlayers = useMemo(() => sortPlayersByNumber(players, "asc"), [players]);

  const filteredPlayers =
    activeTab === "ALLE" ? sortedPlayers : sortedPlayers.filter((p) => p.position === activeTab);

  return (
    <>
      <div className="no-scrollbar flex gap-1 mb-10 overflow-x-auto overscroll-x-contain snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`btn-press snap-start shrink-0 flex min-h-11 items-center text-[10px] font-bold tracking-widest uppercase px-4 transition-colors ${
              activeTab === tab
                ? "bg-black text-white"
                : "text-[#8a847c] hover:text-black active:text-black"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredPlayers.map((player) => (
          <Link key={player.id} href={`/spillere/${player.id}`} className="group">
            <div className="aspect-3/4 bg-[#edeae3] mb-3 overflow-hidden relative">
              {player.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={player.image_url} alt={player.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/images/player-placeholder.png" alt={player.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300 opacity-60" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl text-[#c5bfb6]">{player.number}</span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide group-hover:underline">{player.name}</h3>
                <p className="text-[10px] text-[#6b6560] uppercase tracking-wider">
                  {player.position}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
