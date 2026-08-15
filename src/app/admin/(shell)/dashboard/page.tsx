import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

function resolveCount(r: PromiseSettledResult<{ count: number | null; error: unknown }>): number {
  if (r.status === "rejected") return 0;
  if (r.value?.error) return 0;
  return r.value?.count ?? 0;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}

export default async function DashboardPage() {
  const today = new Date().toISOString().split("T")[0];

  // Run count queries and feed queries in parallel
  const [counts, feed] = await Promise.all([
    Promise.allSettled([
      supabase.from("articles").select("id", { count: "exact", head: true }),
      supabase.from("players").select("id", { count: "exact", head: true }),
      supabase.from("matches").select("id", { count: "exact", head: true }),
      supabase.from("standings").select("id", { count: "exact", head: true }),
    ]),
    Promise.allSettled([
      supabase
        .from("matches")
        .select("id, date, time, home, away")
        .eq("status", "scheduled")
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(3),
      supabase
        .from("articles")
        .select("id, title, category, date")
        .order("date", { ascending: false })
        .limit(3),
    ]),
  ]);

  const [articles, players, matches, standings] = counts;

  const [upcomingMatches, recentArticles] = feed;

  const stats = [
    { label: "Artikler", count: resolveCount(articles), href: "/admin/nyheder", sub: "Offentliggjorte nyheder" },
    { label: "Spillere", count: resolveCount(players), href: "/admin/spillere", sub: "I truppen" },
    { label: "Kampe", count: resolveCount(matches), href: "/admin/kampe", sub: "Registrerede kampe" },
    { label: "Hold i stilling", count: resolveCount(standings), href: "/admin/stilling", sub: "Rækkeinddelinger" },
  ];

  const actions = [
    { href: "/admin/nyheder/ny", label: "Skriv ny artikel", desc: "Opret og publicér en nyhed" },
    { href: "/admin/spillere", label: "Administrér truppen", desc: "Tilføj eller opdatér spillere" },
    { href: "/admin/kampe", label: "Tilføj kampresultat", desc: "Registrér kampe og resultater" },
    { href: "/admin/live", label: "Kør livekamp", desc: "Styr live ur, events og lineup" },
    { href: "/admin/stilling", label: "Opdatér stilling", desc: "Redigér rækkeinddelingen" },
  ];

  const nextMatches =
    upcomingMatches.status === "fulfilled" && !upcomingMatches.value.error
      ? (upcomingMatches.value.data ?? [])
      : [];

  const latestArticles =
    recentArticles.status === "fulfilled" && !recentArticles.value.error
      ? (recentArticles.value.data ?? [])
      : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-gray-400 mb-1">Vanløse IF</p>
        <h1 className="font-display text-5xl tracking-tight text-gray-900">DASHBOARD</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group bg-gray-50 border border-gray-200 px-6 py-6 hover:border-gray-300 transition-colors"
          >
            <div className="font-display text-6xl lg:text-7xl leading-none mb-2 tabular-nums text-gray-900">
              {s.count}
            </div>
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-500 mb-0.5">
              {s.label}
            </div>
            <div className="text-[10px] text-gray-400">{s.sub}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-gray-400 mb-3">
          Hurtige handlinger
        </p>
        <div className="bg-gray-50 border border-gray-200 divide-y divide-gray-100">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-900">{action.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{action.desc}</p>
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-gray-400 group-hover:text-accent transition-colors shrink-0"
              >
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming matches */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-gray-400">Kommende kampe</p>
            <Link
              href="/admin/kampe"
              className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
            >
              Se alle →
            </Link>
          </div>
          <div className="border border-gray-200 divide-y divide-gray-100">
            {nextMatches.length === 0 ? (
              <p className="px-4 py-5 text-[10px] text-gray-300 text-center">Ingen kommende kampe</p>
            ) : (
              nextMatches.map((match) => (
                <Link
                  key={match.id}
                  href="/admin/kampe"
                  className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">
                      {match.home} – {match.away}
                    </p>
                    <p className="text-[9px] uppercase tracking-widest text-gray-400 mt-0.5">
                      {match.time
                        ? `${formatDate(match.date)} kl. ${match.time}`
                        : formatDate(match.date)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent articles */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-gray-400">Seneste artikler</p>
            <Link
              href="/admin/nyheder"
              className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
            >
              Se alle →
            </Link>
          </div>
          <div className="border border-gray-200 divide-y divide-gray-100">
            {latestArticles.length === 0 ? (
              <p className="px-4 py-5 text-[10px] text-gray-300 text-center">Ingen artikler endnu</p>
            ) : (
              latestArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/admin/nyheder/${article.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{article.title}</p>
                    <p className="text-[9px] uppercase tracking-widest text-gray-400 mt-0.5">
                      {article.category} · {formatDate(article.date)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
