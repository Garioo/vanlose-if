import type { Player } from "@/lib/supabase";

export function getPlayerNumberSortValue(player: Pick<Player, "number">): number | null {
  const raw = player.number?.trim() ?? "";
  if (!raw) return null;

  const match = raw.match(/\d+/);
  if (!match) return null;

  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function sortPlayersByNumber<T extends Pick<Player, "number">>(
  players: T[],
  direction: "asc" | "desc" = "asc",
): T[] {
  return players
    .map((player, index) => ({
      player,
      index,
      value: getPlayerNumberSortValue(player),
    }))
    .sort((a, b) => {
      if (a.value == null && b.value == null) return a.index - b.index;
      if (a.value == null) return 1;
      if (b.value == null) return -1;
      if (a.value === b.value) return a.index - b.index;
      return direction === "asc" ? a.value - b.value : b.value - a.value;
    })
    .map((entry) => entry.player);
}
