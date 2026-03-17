"use client";

import { useMemo, useState } from "react";
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
      <div className="flex flex-wrap gap-1 mb-10">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[10px] font-bold tracking-widest uppercase px-4 py-2 transition-colors ${
              activeTab === tab ? "bg-black text-white" : "text-[#8a847c] hover:text-black"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredPlayers.map((player) => (
          <div key={player.id} className="group cursor-pointer">
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
                <h3 className="text-xs font-bold uppercase tracking-wide">{player.name}</h3>
                <p className="text-[10px] text-[#6b6560] uppercase tracking-wider">
                  {player.position}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
