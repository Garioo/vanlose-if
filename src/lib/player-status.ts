import type { Player, PlayerStatus } from "@/lib/supabase";

export const PLAYER_STATUSES: PlayerStatus[] = ["active", "transferred", "retired"];

export const PLAYER_STATUS_LABELS: Record<PlayerStatus, string> = {
  active: "Aktiv",
  transferred: "Skiftet klub",
  retired: "Stoppet",
};

/** A player is only shown in the public squad while they are active. */
export function isActivePlayer(player: Pick<Player, "status">): boolean {
  return player.status === "active";
}

function formatLeaveDate(left_at: string | null): string | null {
  if (!left_at) return null;
  const date = new Date(left_at);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("da-DK", { month: "long", year: "numeric" });
}

/**
 * One-line explanation of a departure, e.g.
 *   "Skiftet til Fremad Amager, juni 2026"
 *   "Stoppet, juni 2026"
 *   "Skiftet klub"          (when no club or date was recorded)
 * Returns null for active players.
 */
export function describePlayerDeparture(
  player: Pick<Player, "status" | "new_club" | "left_at">,
): string | null {
  if (player.status === "active") return null;

  const when = formatLeaveDate(player.left_at);
  const club = player.new_club?.trim();

  const base =
    player.status === "transferred" && club
      ? `Skiftet til ${club}`
      : PLAYER_STATUS_LABELS[player.status];

  return when ? `${base}, ${when}` : base;
}
