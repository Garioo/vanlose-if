"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// All routes verified against src/app/admin/(shell)/ directories
const groups = [
  {
    label: "Indhold",
    links: [
      { href: "/admin/nyheder", label: "Nyheder" },
      { href: "/admin/spillere", label: "Spillere" },
      { href: "/admin/hold", label: "Hold" },
      { href: "/admin/kampe", label: "Kampe & Resultater" },
      { href: "/admin/live", label: "Livekontrol", live: true },
      { href: "/admin/stilling", label: "Stilling" },
    ],
  },
  {
    label: "Klub",
    links: [
      { href: "/admin/henvendelser", label: "Henvendelser" },
      { href: "/admin/sponsorer", label: "Sponsorer" },
      { href: "/admin/ungdom", label: "Ungdom" },
      { href: "/admin/medlemskaber", label: "Medlemskaber" },
      { href: "/admin/frivillig", label: "Frivillig" },
    ],
  },
  {
    label: "System",
    links: [{ href: "/admin/indstillinger", label: "Indstillinger" }],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-52 bg-[#0d0d0b] border-r border-[#2a2825] fixed inset-y-0 left-0 flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#2a2825]">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center bg-white text-black text-xs font-black tracking-tight shrink-0">
            VIF
          </div>
          <div>
            <div className="text-[10px] font-black tracking-[0.2em] uppercase text-[#f0ede8]">
              Vanløse IF
            </div>
            <div className="text-[9px] text-[#3a3733] tracking-widest uppercase">Admin</div>
          </div>
        </Link>
      </div>

      {/* Live button */}
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
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[#3a3733] px-3 mb-1 mt-4">
              {group.label}
            </p>
            {group.links.map(({ href, label, live }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase px-3 py-2 transition-all",
                    isActive
                      ? "border-l-2 border-red-600 bg-white/5 text-white pl-[10px]"
                      : "border-l-2 border-transparent text-[#5a5550] hover:text-[#a09890] hover:bg-white/3 pl-[10px]",
                  ].join(" ")}
                >
                  {label}
                  {live && isActive && (
                    <span className="ml-auto inline-block h-1.5 w-1.5 rounded-full bg-red-600" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
