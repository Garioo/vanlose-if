import Link from "next/link";
import LogoutButton from "@/app/admin/LogoutButton";

const sidebarLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "▪" },
  { href: "/admin/nyheder", label: "Nyheder", icon: "▪" },
  { href: "/admin/spillere", label: "Spillere", icon: "▪" },
  { href: "/admin/hold", label: "Hold", icon: "▪" },
  { href: "/admin/kampe", label: "Kampe & Resultater", icon: "▪" },
  { href: "/admin/live", label: "Livekontrol", icon: "▪" },
  { href: "/admin/stilling", label: "Stilling", icon: "▪" },
  { href: "/admin/henvendelser", label: "Henvendelser", icon: "▪" },
];

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex">
      {/* Sidebar */}
      <aside className="w-52 bg-[#0a0a0a] text-white fixed inset-y-0 left-0 flex flex-col z-50">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center bg-white text-black text-xs font-black tracking-tight">
              VIF
            </div>
            <div>
              <div className="text-[10px] font-black tracking-[0.2em] uppercase text-white">Vanløse IF</div>
              <div className="text-[9px] text-white/30 tracking-widest uppercase">Admin</div>
            </div>
          </Link>
        </div>

        <div className="px-3 pt-3">
          <Link
            href="/admin/live"
            className="flex items-center justify-center gap-2 w-full bg-red-600 text-white text-[10px] font-black tracking-[0.2em] uppercase px-3 py-2.5 hover:bg-red-500 transition-colors"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-white" />
            Live Nu
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3">
          <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20 px-3 mb-2">Menu</div>
          {sidebarLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase px-3 py-2.5 text-white/40 hover:text-white hover:bg-white/6 rounded-sm transition-all"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 pb-5 border-t border-white/8 pt-4 space-y-0.5">
          <LogoutButton />
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[10px] text-white/25 hover:text-white/60 tracking-widest uppercase px-3 py-2 transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5m7 7-7-7 7-7" />
            </svg>
            Til sitet
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-52 min-h-screen flex flex-col">
        <main className="flex-1 p-8 max-w-5xl">
          {children}
        </main>
      </div>
    </div>
  );
}
