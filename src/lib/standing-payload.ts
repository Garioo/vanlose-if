import { supabaseAdmin } from "@/lib/supabase-admin";

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeId(value: unknown): string | null {
  const text = normalizeText(value);
  return text ? text : null;
}

export async function buildStandingWritePayload(body: unknown) {
  const input = (body ?? {}) as Record<string, unknown>;
  const teamId = normalizeId(input.team_id);
  let teamName = normalizeText(input.team);

  if (teamId) {
    const { data } = await supabaseAdmin.from("teams").select("name").eq("id", teamId).maybeSingle();
    const fetchedName = typeof (data as { name?: unknown } | null)?.name === "string"
      ? (data as { name?: string }).name
      : "";
    if (fetchedName) {
      teamName = fetchedName;
    }
  }

  return {
    pos: normalizeNumber(input.pos, 1),
    team: teamName,
    team_id: teamId,
    played: normalizeNumber(input.played, 0),
    wins: normalizeNumber(input.wins, 0),
    draws: normalizeNumber(input.draws, 0),
    losses: normalizeNumber(input.losses, 0),
    goals_scored: normalizeNumber(input.goals_scored, 0),
    goals_conceded: normalizeNumber(input.goals_conceded, 0),
    pts: normalizeNumber(input.pts, 0),
    highlight: typeof input.highlight === "boolean" ? input.highlight : false,
    gruppe: normalizeText(input.gruppe) || "regular",
  };
}
