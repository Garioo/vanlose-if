import { expect, test } from "@playwright/test";
import { selectHomeMatches } from "../../src/lib/home-matches";
import type { Match } from "../../src/lib/supabase";

const now = Date.parse("2026-09-05T12:00:00Z");
function fixture(id: string, kickoff_at: string | null, status: Match["status"] = "scheduled"): Match {
  return { id, kickoff_at, date: "", time: null, status } as Match;
}

test("skips stale scheduled fixtures and picks the nearest future kickoff", () => {
  const old = fixture("old", "2026-08-22T12:00:00Z");
  const next = fixture("next", "2026-09-13T12:00:00Z");
  const later = fixture("later", "2026-09-20T12:00:00Z");
  expect(selectHomeMatches([later, old, next], now).next?.id).toBe("next");
});

test("prioritizes a live match even after kickoff", () => {
  const live = fixture("live", "2026-09-05T11:00:00Z", "live");
  expect(selectHomeMatches([fixture("next", "2026-09-13T12:00:00Z"), live], now).next?.id).toBe("live");
});

test("returns an empty upcoming state for past and undated fixtures", () => {
  expect(selectHomeMatches([fixture("old", "2026-08-22T12:00:00Z"), fixture("unknown", null)], now).next).toBeNull();
});

test("selects the latest completed match independently of upcoming flags", () => {
  const recent = fixture("recent", "2026-09-04T12:00:00Z", "finished");
  const older = fixture("older", "2026-08-22T12:00:00Z", "finished");
  expect(selectHomeMatches([recent, fixture("scheduled", "2026-09-06T12:00:00Z"), older], now).latest?.id).toBe("recent");
});
