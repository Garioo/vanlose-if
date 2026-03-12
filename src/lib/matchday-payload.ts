import type { LineupPlayerSlot, MatchEventTeamSide, MatchEventType } from "@/lib/supabase";

type ParseResult<T> = { ok: true; payload: T } | { ok: false; error: string };

export type LiveAction = "start" | "pause" | "resume_second_half" | "finish" | "set_note";

type LiveActionPayload = {
  action: LiveAction;
  has_period_label: boolean;
  period_label: string | null;
  has_matchday_notes: boolean;
  matchday_notes: string | null;
};

type EventPayload = {
  team_side: MatchEventTeamSide;
  event_type: MatchEventType;
  minute: number | null;
  stoppage_minute: number | null;
  player_name: string | null;
  assist_name: string | null;
  note: string | null;
};

type LineupPayload = {
  team_side: MatchEventTeamSide;
  formation: string | null;
  starters: LineupPlayerSlot[];
  bench: LineupPlayerSlot[];
  confirmed: boolean;
};

const VALID_EVENT_TYPES = new Set<MatchEventType>([
  "goal",
  "yellow_card",
  "red_card",
  "substitution",
  "kickoff",
  "halftime",
  "fulltime",
]);

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseNullableMinute(value: unknown): number | null {
  if (value == null || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const rounded = Math.floor(num);
  if (rounded < 0 || rounded > 130) return null;
  return rounded;
}

function normalizeTeamSide(value: unknown): MatchEventTeamSide | null {
  const text = normalizeText(value).toLowerCase();
  if (text === "home" || text === "away") return text;
  return null;
}

function parseLineupPlayers(value: unknown): LineupPlayerSlot[] | null {
  if (!Array.isArray(value)) return null;
  const players: LineupPlayerSlot[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;
    const row = entry as Record<string, unknown>;
    const name = normalizeText(row.name);
    if (!name) return null;
    players.push({
      name,
      number: normalizeText(row.number) || null,
      position: normalizeText(row.position) || null,
      captain: Boolean(row.captain),
      goalkeeper: Boolean(row.goalkeeper),
    });
  }
  return players;
}

function dedupeKey(player: LineupPlayerSlot): string {
  const number = player.number?.trim() ?? "";
  const name = player.name.trim().toLocaleLowerCase("da-DK");
  return number ? `${number}|${name}` : `name|${name}`;
}

export function parseLiveActionPayload(body: unknown): ParseResult<LiveActionPayload> {
  const input = (body ?? {}) as Record<string, unknown>;
  const action = normalizeText(input.action).toLowerCase() as LiveAction;
  if (
    action !== "start" &&
    action !== "pause" &&
    action !== "resume_second_half" &&
    action !== "finish" &&
    action !== "set_note"
  ) {
    return { ok: false, error: "Invalid action." };
  }

  return {
    ok: true,
    payload: {
      action,
      has_period_label: Object.prototype.hasOwnProperty.call(input, "period_label"),
      period_label: normalizeText(input.period_label) || null,
      has_matchday_notes: Object.prototype.hasOwnProperty.call(input, "matchday_notes"),
      matchday_notes: normalizeText(input.matchday_notes) || null,
    },
  };
}

export function parseEventPayload(body: unknown): ParseResult<EventPayload> {
  const input = (body ?? {}) as Record<string, unknown>;
  const teamSide = normalizeTeamSide(input.team_side);
  if (!teamSide) return { ok: false, error: "Invalid team side." };

  const type = normalizeText(input.event_type).toLowerCase() as MatchEventType;
  if (!VALID_EVENT_TYPES.has(type)) {
    return { ok: false, error: "Invalid event type." };
  }

  const minute = parseNullableMinute(input.minute);
  if (input.minute != null && input.minute !== "" && minute == null) {
    return { ok: false, error: "Invalid minute." };
  }

  const stoppageMinute = parseNullableMinute(input.stoppage_minute);
  if (input.stoppage_minute != null && input.stoppage_minute !== "" && stoppageMinute == null) {
    return { ok: false, error: "Invalid stoppage minute." };
  }

  return {
    ok: true,
    payload: {
      team_side: teamSide,
      event_type: type,
      minute,
      stoppage_minute: stoppageMinute,
      player_name: normalizeText(input.player_name) || null,
      assist_name: normalizeText(input.assist_name) || null,
      note: normalizeText(input.note) || null,
    },
  };
}

export function parseLineupPayload(body: unknown): ParseResult<LineupPayload> {
  const input = (body ?? {}) as Record<string, unknown>;
  const teamSide = normalizeTeamSide(input.team_side);
  if (!teamSide) return { ok: false, error: "Invalid team side." };

  const starters = parseLineupPlayers(input.starters);
  if (!starters) return { ok: false, error: "Invalid starters payload." };
  const bench = parseLineupPlayers(input.bench);
  if (!bench) return { ok: false, error: "Invalid bench payload." };

  const keys = new Set<string>();
  for (const player of [...starters, ...bench]) {
    const key = dedupeKey(player);
    if (keys.has(key)) {
      return { ok: false, error: "Samme spiller kan ikke være i både startopstilling og bænken." };
    }
    keys.add(key);
  }

  return {
    ok: true,
    payload: {
      team_side: teamSide,
      formation: normalizeText(input.formation) || null,
      starters,
      bench,
      confirmed: Boolean(input.confirmed),
    },
  };
}
