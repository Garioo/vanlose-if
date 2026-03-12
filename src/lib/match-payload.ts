import { supabaseAdmin } from "@/lib/supabase-admin";
import { parseMatchKickoffIso } from "@/lib/matchDate";

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeId(value: unknown): string | null {
  const text = normalizeText(value);
  return text.length > 0 ? text : null;
}

function normalizeNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeMatchStatus(value: unknown): "scheduled" | "live" | "finished" {
  const text = normalizeText(value).toLowerCase();
  if (text === "live") return "live";
  if (text === "finished") return "finished";
  return "scheduled";
}

export async function buildMatchWritePayload(body: unknown) {
  const input = (body ?? {}) as Record<string, unknown>;
  const date = normalizeText(input.date);
  const timeText = normalizeText(input.time);
  const homeTeamId = normalizeId(input.home_team_id);
  const awayTeamId = normalizeId(input.away_team_id);
  const ids = [homeTeamId, awayTeamId].filter((id): id is string => !!id);

  const nameById = new Map<string, string>();
  if (ids.length > 0) {
    const { data } = await supabaseAdmin.from("teams").select("id,name").in("id", ids);
    for (const row of (data ?? []) as Array<Record<string, unknown>>) {
      const id = typeof row.id === "string" ? row.id : null;
      const name = typeof row.name === "string" ? row.name : null;
      if (id && name) {
        nameById.set(id, name);
      }
    }
  }

  const home = homeTeamId ? (nameById.get(homeTeamId) ?? normalizeText(input.home)) : normalizeText(input.home);
  const away = awayTeamId ? (nameById.get(awayTeamId) ?? normalizeText(input.away)) : normalizeText(input.away);

  const kickoffAt = parseMatchKickoffIso(date, timeText || null);
  const result = normalizeText(input.result);
  const status = normalizeMatchStatus(input.status);
  const liveMinute = normalizeNumber(input.live_minute);
  const periodLabel = normalizeText(input.period_label) || null;
  const matchdayNotes = normalizeText(input.matchday_notes) || null;
  const isUpcoming =
    typeof input.is_upcoming === "boolean"
      ? input.is_upcoming
      : status === "finished"
        ? false
        : true;

  return {
    date,
    time: timeText || null,
    kickoff_at: kickoffAt,
    home,
    home_team_id: homeTeamId,
    away,
    away_team_id: awayTeamId,
    venue: normalizeText(input.venue) || null,
    home_score: normalizeNumber(input.home_score),
    away_score: normalizeNumber(input.away_score),
    result: result === "win" || result === "draw" || result === "loss" ? result : null,
    is_upcoming: isUpcoming,
    status,
    live_minute: liveMinute,
    period_label: periodLabel,
    matchday_notes: matchdayNotes,
  };
}
