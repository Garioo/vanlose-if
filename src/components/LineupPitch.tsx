"use client";

import type { LineupPlayerSlot } from "@/lib/supabase";

export type PlayerEventSummary = {
  goals: number;
  assists: number;
  yellowCard: boolean;
  redCard: boolean;
  subOut: boolean;
  subIn: boolean;
};

type Props = {
  starters: LineupPlayerSlot[];
  bench: LineupPlayerSlot[];
  formation: string | null;
  confirmed: boolean;
  playerEvents?: Record<string, PlayerEventSummary>;
  hideMeta?: boolean;
};

function lastName(name: string): string {
  const parts = name.trim().split(" ");
  return parts[parts.length - 1] ?? name;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}


function PlayerDot({ player, size = 34, summary }: { player: LineupPlayerSlot; size?: number; summary?: PlayerEventSummary }) {
  const isGK = player.goalkeeper === true;

  // Build bottom-row badges (shown below name)
  const bottomBadges: React.ReactNode[] = [];
  if (summary) {
    for (let i = 0; i < summary.goals; i++) {
      bottomBadges.push(
        <span key={`g${i}`} style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", backgroundColor: "#fff", border: "1.5px solid #111", boxShadow: "0 1px 3px rgba(0,0,0,0.5)" }} title="Mål" />
      );
    }
    for (let i = 0; i < summary.assists; i++) {
      bottomBadges.push(
        <span key={`a${i}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 12, height: 12, borderRadius: "50%", backgroundColor: "#3b82f6", border: "1.5px solid #fff", color: "#fff", fontSize: 7, fontWeight: 800 }} title="Assist">A</span>
      );
    }
    if (summary.yellowCard) {
      bottomBadges.push(
        <span key="yc" style={{ display: "inline-block", width: 8, height: 11, borderRadius: 1.5, backgroundColor: "#facc15", border: "1.5px solid #78350f", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} title="Gult kort" />
      );
    }
    if (summary.redCard) {
      bottomBadges.push(
        <span key="rc" style={{ display: "inline-block", width: 8, height: 11, borderRadius: 1.5, backgroundColor: "#ef4444", border: "1.5px solid #7f1d1d", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} title="Rødt kort" />
      );
    }
    if (summary.subOut) {
      bottomBadges.push(
        <span key="out" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ef4444", border: "1.5px solid #fff", color: "#fff", fontSize: 9, fontWeight: 900, lineHeight: 1 }} title="Udskiftet">↓</span>
      );
    }
    if (summary.subIn) {
      bottomBadges.push(
        <span key="in" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 12, height: 12, borderRadius: "50%", backgroundColor: "#22c55e", border: "1.5px solid #fff", color: "#fff", fontSize: 9, fontWeight: 900, lineHeight: 1 }} title="Kom ind">↑</span>
      );
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: isGK ? "#f59e0b" : "#ffffff",
          color: "#111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: size * 0.32,
          boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        {player.number ?? "—"}
        {player.captain && (
          <div
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              width: 13,
              height: 13,
              borderRadius: "50%",
              backgroundColor: "#111",
              color: "#fff",
              fontSize: 7,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            C
          </div>
        )}
      </div>
      <div
        style={{
          color: "#fff",
          fontSize: 9,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
          textShadow: "0 1px 3px rgba(0,0,0,0.7)",
          lineHeight: 1.1,
          maxWidth: size * 2.2,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {lastName(player.name)}
      </div>
      {bottomBadges.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginTop: 1 }}>
          {bottomBadges}
        </div>
      )}
    </div>
  );
}

export default function LineupPitch({ starters, bench, formation, playerEvents, hideMeta }: Props) {
  const formationRows: number[] = formation
    ? formation.split("-").map((n) => parseInt(n, 10)).filter((n) => !isNaN(n) && n > 0)
    : [];

  const gkIndex = starters.findIndex((p) => p.goalkeeper === true);
  const resolvedGkIdx = gkIndex !== -1 ? gkIndex : 0;
  const gk = starters[resolvedGkIdx];
  const outfield = starters.filter((_, i) => i !== resolvedGkIdx);

  const rows: LineupPlayerSlot[][] = [];
  let cursor = 0;
  if (formationRows.length > 0) {
    for (const count of formationRows) {
      rows.push(outfield.slice(cursor, cursor + count));
      cursor += count;
    }
    if (cursor < outfield.length) {
      rows[rows.length - 1] = [...(rows[rows.length - 1] ?? []), ...outfield.slice(cursor)];
    }
  } else {
    const chunk = Math.ceil(outfield.length / 3);
    for (let i = 0; i < outfield.length; i += chunk) {
      rows.push(outfield.slice(i, i + chunk));
    }
  }

  const allRows: LineupPlayerSlot[][] = [...[...rows].reverse()];
  if (gk) allRows.push([gk]);

  const topY = 10;
  const botY = 88;

  const positioned: Array<{ player: LineupPlayerSlot; x: number; y: number }> = [];
  allRows.forEach((row, rowIdx) => {
    const y =
      allRows.length === 1
        ? (topY + botY) / 2
        : topY + (rowIdx * (botY - topY)) / (allRows.length - 1);
    row.forEach((player, playerIdx) => {
      const x = ((playerIdx + 1) * 100) / (row.length + 1);
      positioned.push({ player, x, y });
    });
  });

  function getSummary(name: string): PlayerEventSummary | undefined {
    return playerEvents?.[normalizeName(name)];
  }

  return (
    <div>
      {/* Pitch */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 560,
          maxHeight: 420,
          aspectRatio: "3 / 4",
          overflow: "hidden",
          backgroundColor: "#3a7d44",
        }}
      >
        {/* Grass stripes */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${i * 12.5}%`,
              height: "12.5%",
              backgroundColor: i % 2 === 0 ? "rgba(0,0,0,0.07)" : "transparent",
              pointerEvents: "none",
            }}
          />
        ))}

        {/* SVG pitch lines */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          viewBox="0 0 300 400"
          preserveAspectRatio="none"
          fill="none"
        >
          <rect x="10" y="10" width="280" height="380" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
          <line x1="10" y1="200" x2="290" y2="200" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
          <ellipse cx="150" cy="200" rx="38" ry="30" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
          <circle cx="150" cy="200" r="3" fill="rgba(255,255,255,0.6)" />
          <rect x="80" y="10" width="140" height="66" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
          <rect x="115" y="10" width="70" height="24" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
          <rect x="80" y="324" width="140" height="66" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
          <rect x="115" y="366" width="70" height="24" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
          <circle cx="150" cy="55" r="2.5" fill="rgba(255,255,255,0.6)" />
          <circle cx="150" cy="345" r="2.5" fill="rgba(255,255,255,0.6)" />
        </svg>

        {/* Players */}
        {positioned.map(({ player, x, y }, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <PlayerDot player={player} summary={getSummary(player.name)} />
          </div>
        ))}
      </div>

      {/* Formation label */}
      {!hideMeta && formation && (
        <p
          style={{
            marginTop: 8,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#9ca3af",
          }}
        >
          Formation: {formation}
        </p>
      )}

      {/* Bench */}
      {!hideMeta && bench.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#9ca3af",
              marginRight: 2,
            }}
          >
            Bænk
          </span>
          {bench.map((player, i) => {
            const summary = getSummary(player.name);
            return (
              <span
                key={`${player.name}-${i}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  border: "1px solid #e5e7eb",
                  padding: "2px 6px",
                  fontSize: 10,
                  color: "#6b7280",
                  fontWeight: 500,
                }}
              >
                {player.number ? `#${player.number} ` : ""}
                {lastName(player.name)}
                {summary && (
                  <span style={{ display: "inline-flex", gap: 2, alignItems: "center" }}>
                    {summary.subIn && <span style={{ color: "#4ade80", fontSize: 9, fontWeight: 700 }}>↑</span>}
                    {summary.yellowCard && <span style={{ display: "inline-block", width: 4, height: 6, borderRadius: 0.5, backgroundColor: "#fbbf24" }} />}
                    {summary.redCard && <span style={{ display: "inline-block", width: 4, height: 6, borderRadius: 0.5, backgroundColor: "#ef4444" }} />}
                    {Array.from({ length: summary.goals }).map((_, gi) => (
                      <span key={gi} style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", backgroundColor: "#374151", boxShadow: "0 0 0 1px #9ca3af" }} />
                    ))}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
