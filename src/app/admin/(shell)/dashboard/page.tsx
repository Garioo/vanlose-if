import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [articles, players, matches, standings, contact, volunteer, newsletter] = await Promise.all([
    supabase.from("articles").select("id", { count: "exact", head: true }),
    supabase.from("players").select("id", { count: "exact", head: true }),
    supabase.from("matches").select("id", { count: "exact", head: true }),
    supabase.from("standings").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("contact_submissions").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("volunteer_submissions").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("newsletter_subscriptions").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Artikler", count: articles.count ?? 0, href: "/admin/nyheder", sub: "Offentliggjorte nyheder" },
    { label: "Spillere", count: players.count ?? 0, href: "/admin/spillere", sub: "I truppen" },
    { label: "Kampe", count: matches.count ?? 0, href: "/admin/kampe", sub: "Registrerede kampe" },
    { label: "Hold i stilling", count: standings.count ?? 0, href: "/admin/stilling", sub: "Rækkeinddelinger" },
    {
      label: "Henvendelser",
      count: (contact.count ?? 0) + (volunteer.count ?? 0) + (newsletter.count ?? 0),
      href: "/admin/henvendelser",
      sub: "Kontakt, frivillig, nyhedsbrev",
    },
  ];

  const actions = [
    { href: "/admin/nyheder/ny", label: "Skriv ny artikel", desc: "Opret og publicér en nyhed" },
    { href: "/admin/spillere", label: "Administrér truppen", desc: "Tilføj eller opdatér spillere" },
    { href: "/admin/kampe", label: "Tilføj kampresultat", desc: "Registrér kampe og resultater" },
    { href: "/admin/live", label: "Kør livekamp", desc: "Styr live ur, events og lineup" },
    { href: "/admin/stilling", label: "Opdatér stilling", desc: "Redigér rækkeinddelingen" },
    { href: "/admin/henvendelser", label: "Tjek henvendelser", desc: "Håndter indkomne formularer" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-1">Vanløse IF</p>
        <h1 className="font-display text-4xl tracking-tight">DASHBOARD</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-10">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white border border-gray-200 px-5 py-5 hover:border-gray-400 transition-colors group"
          >
            <div className="font-display text-5xl leading-none mb-3 tabular-nums">{s.count}</div>
            <div className="text-[11px] font-black tracking-widest uppercase text-black mb-0.5">{s.label}</div>
            <div className="text-[10px] text-gray-400">{s.sub}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-3">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-3">Hurtige handlinger</p>
        <div className="bg-white border border-gray-200 divide-y divide-gray-100">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
            >
              <div>
                <p className="text-xs font-black uppercase tracking-wide">{action.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{action.desc}</p>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-300 group-hover:text-black transition-colors shrink-0">
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
