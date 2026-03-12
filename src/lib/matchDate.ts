import type { Match } from "@/lib/supabase";

const monthMap: Record<string, number> = {
  jan: 1,
  januar: 1,
  feb: 2,
  februar: 2,
  mar: 3,
  marts: 3,
  apr: 4,
  april: 4,
  maj: 5,
  jun: 6,
  juni: 6,
  jul: 7,
  juli: 7,
  aug: 8,
  august: 8,
  sep: 9,
  september: 9,
  okt: 10,
  oktober: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function parseYear(value: string | undefined): number {
  if (!value) return new Date().getFullYear();
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return new Date().getFullYear();
  if (parsed < 100) return 2000 + parsed;
  return parsed;
}

function parseTime(text: string | null | undefined): { hour: number; minute: number } {
  if (!text) return { hour: 12, minute: 0 };
  const match = text.trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (!match) return { hour: 12, minute: 0 };
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour > 23 || minute > 59) {
    return { hour: 12, minute: 0 };
  }
  return { hour, minute };
}

export function parseMatchTimestamp(dateText: string, timeText?: string | null): number | null {
  const date = dateText.trim();
  if (!date) return null;

  let year = new Date().getFullYear();
  let month = 0;
  let day = 0;

  let match = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  } else {
    match = date.match(/^(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{2,4}))?$/);
    if (match) {
      day = Number(match[1]);
      month = Number(match[2]);
      year = parseYear(match[3]);
    } else {
      match = date.match(/^(\d{1,2})\.?\s*([A-Za-zÆØÅæøå]+)\.?(?:\s+(\d{2,4}))?$/);
      if (!match) return null;
      day = Number(match[1]);
      const monthKey = match[2].toLowerCase().replace(/\./g, "");
      month = monthMap[monthKey] ?? 0;
      year = parseYear(match[3]);
    }
  }

  if (!year || !month || !day) return null;

  const { hour, minute } = parseTime(timeText);
  const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed.getTime();
}

export function parseMatchKickoffIso(dateText: string, timeText?: string | null): string | null {
  const ts = parseMatchTimestamp(dateText, timeText);
  if (ts == null) return null;
  return new Date(ts).toISOString();
}

export function getMatchSortTimestamp(match: Pick<Match, "kickoff_at" | "date" | "time">): number | null {
  if (match.kickoff_at) {
    const kickoffTs = Date.parse(match.kickoff_at);
    if (Number.isFinite(kickoffTs)) {
      return kickoffTs;
    }
  }
  return parseMatchTimestamp(match.date, match.time);
}

export function sortMatchesByKickoff(matches: Match[], direction: "asc" | "desc"): Match[] {
  return matches
    .map((match, index) => ({
      match,
      index,
      ts: getMatchSortTimestamp(match),
    }))
    .sort((a, b) => {
      if (a.ts == null && b.ts == null) return a.index - b.index;
      if (a.ts == null) return 1;
      if (b.ts == null) return -1;
      return direction === "asc" ? a.ts - b.ts : b.ts - a.ts;
    })
    .map((entry) => entry.match);
}
