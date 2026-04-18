type ClockFields = {
  status?: string | null;
  live_phase?: string | null;
  live_minute?: number | null;
  live_clock_running?: boolean | null;
  live_clock_started_at?: string | null;
  live_clock_accumulated_seconds?: number | null;
};

function safeFloor(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function getLiveClockSeconds(match: ClockFields, nowMs = Date.now()): number {
  const accumulated = safeFloor(match.live_clock_accumulated_seconds ?? 0);
  if (!match.live_clock_running || !match.live_clock_started_at) {
    return accumulated;
  }

  const startedMs = Date.parse(match.live_clock_started_at);
  if (!Number.isFinite(startedMs)) {
    return accumulated;
  }

  const elapsed = Math.max(0, nowMs - startedMs);
  return accumulated + safeFloor(elapsed / 1000);
}

export function getLiveClockMinute(match: ClockFields, nowMs = Date.now()): number | null {
  const seconds = getLiveClockSeconds(match, nowMs);
  if (seconds > 0) return safeFloor(seconds / 60);

  if (typeof match.live_minute === "number" && Number.isFinite(match.live_minute)) {
    return safeFloor(match.live_minute);
  }

  if (match.status === "live" || match.status === "finished") return 0;
  return null;
}

export function formatClockSeconds(totalSeconds: number): string {
  const seconds = safeFloor(totalSeconds);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * Returns a football-style clock string that shows stoppage time when the
 * clock exceeds the regulation end of the current half:
 *   first_half  → cap at 45:00, then show "45+1'", "45+2'", …
 *   second_half → cap at 90:00, then show "90+1'", "90+2'", …
 *   other phases → plain MM:SS (e.g. pre-match or halftime shouldn't be running)
 */
export function formatLiveClock(match: ClockFields, nowMs = Date.now()): string {
  const totalSeconds = getLiveClockSeconds(match, nowMs);
  const phase = match.live_phase;

  if (phase === "first_half") {
    const cap = 45 * 60;
    if (totalSeconds > cap) {
      const stoppageMinutes = Math.floor((totalSeconds - cap) / 60);
      return `45+${stoppageMinutes}'`;
    }
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const ss = String(safeFloor(totalSeconds) % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  if (phase === "second_half") {
    const cap = 90 * 60;
    if (totalSeconds > cap) {
      const stoppageMinutes = Math.floor((totalSeconds - cap) / 60);
      return `90+${stoppageMinutes}'`;
    }
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const ss = String(safeFloor(totalSeconds) % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  return formatClockSeconds(totalSeconds);
}

export function withDerivedLiveMinute<T extends ClockFields>(match: T, nowMs = Date.now()): T {
  return {
    ...match,
    live_minute: getLiveClockMinute(match, nowMs),
  };
}
