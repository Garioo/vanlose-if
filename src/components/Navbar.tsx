"use client";

import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SearchOverlay from "@/components/SearchOverlay";
import { useScrollLock } from "@/hooks/useScrollLock";
import type { Match } from "@/lib/supabase";
import { formatMatchDate } from "@/lib/matchDate";

const VIF_LOGO_URL = "/uploads/b479f1c8-7804-4e16-81a1-039a647b1628.png";

const navLinks = [
  { href: "/forsteholdet", label: "Førsteholdet" },
  { href: "/ungdom", label: "Ungdom" },
  { href: "/klubben", label: "Klubben" },
  { href: "/nyheder", label: "Nyheder" },
  { href: "/kampe", label: "Kampe" },
  { href: "/bliv-medlem", label: "Bliv Medlem" },
  { href: "/kontakt", label: "Kontakt" },
];

interface NavbarProps {
  nextMatch?: Match | null;
  todayOrLive?: Match | null;
}

function MatchPill({ match, compact = false }: { match: Match; compact?: boolean }) {
  return (
    <Link
      href={`/kampe/${match.id}`}
      className={`btn-press flex min-h-11 items-center gap-2 border border-accent text-[10px] font-bold uppercase tracking-widest text-accent transition-colors hover:bg-accent hover:text-white ${
        compact ? "px-3 py-2" : "px-4 py-3"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      <span className="truncate">
        {formatMatchDate(match.date)}
        {match.time ? ` · ${match.time}` : ""}
      </span>
    </Link>
  );
}

export default function Navbar({ nextMatch }: NavbarProps = {}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation — covers browser back/forward, which leaves the panel
  // open. Adjusted during render rather than in an effect so the panel never
  // paints open on the new route.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  useScrollLock(mobileOpen);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <>
      <nav className="h-full text-black">
        {/* Tap-outside backdrop — negative z keeps it behind the bar and panel
            but above page content, since the shell wrapper owns the stacking context. */}
        {mobileOpen && (
          <div
            className="fixed inset-0 -z-10 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className="flex h-16 items-center justify-between border-b border-[#e0dbd3]/90 bg-[#f7f4ef]/95 px-4 backdrop-blur lg:hidden">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80 focus-visible:ring-offset-2"
          >
            <Image
              src={VIF_LOGO_URL}
              alt="Vanløse IF"
              width={30}
              height={33}
              className="h-[2.05rem] w-auto shrink-0"
              priority
            />
            <span className="font-display text-sm leading-none tracking-tight">VANLØSE IF</span>
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="btn-press flex h-11 w-11 items-center justify-center rounded transition-colors hover:bg-[#e0dbd3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80 focus-visible:ring-offset-2"
              aria-label="Søg"
            >
              <Search size={18} />
            </button>
            <button
              className="btn-press flex h-11 w-11 items-center justify-center rounded transition-colors hover:bg-[#e0dbd3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80 focus-visible:ring-offset-2 lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Luk menu" : "Menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              <span className="relative block h-3.5 w-5" aria-hidden="true">
                <span
                  className={`absolute left-0 block h-0.5 w-5 bg-black transition-transform duration-200 ease-out ${
                    mobileOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 top-1/2 block h-0.5 w-5 -translate-y-1/2 bg-black transition-opacity duration-200 ease-out ${
                    mobileOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute left-0 block h-0.5 w-5 bg-black transition-transform duration-200 ease-out ${
                    mobileOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>

        {/* Outer wrapper animates height; inner scrolls when the panel is taller
            than the viewport (landscape phones). */}
        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-out lg:hidden ${
            mobileOpen ? "max-h-[calc(100dvh-6.5rem)] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div
            id="mobile-menu"
            inert={!mobileOpen}
            className="max-h-[calc(100dvh-6.5rem)] space-y-2 overflow-y-auto overscroll-contain border-t border-[#e0dbd3] bg-[#f7f4ef] px-4 py-3"
          >
            {nextMatch && <MatchPill match={nextMatch} compact />}
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex min-h-11 items-center rounded px-3 py-2.5 text-sm font-bold uppercase leading-relaxed tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80 focus-visible:ring-offset-2 ${
                  pathname === href || pathname.startsWith(href + "/")
                    ? "bg-accent text-white"
                    : "text-[#4a4540] hover:bg-[#e0dbd3] hover:text-black active:bg-[#e0dbd3] active:text-black"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden h-16 items-center gap-5 border-t-2 border-t-accent border-b border-b-[#d8d2c8] bg-white px-6 lg:flex">
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <Image
              src={VIF_LOGO_URL}
              alt=""
              aria-hidden="true"
              width={40}
              height={44}
              className="h-9 w-auto"
              priority
            />
            <span className="font-display text-lg leading-none tracking-tight text-[#111111]">
              Vanløse IF
            </span>
          </Link>

          {/* Links */}
          <div className="flex flex-1 items-center gap-1">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");

              return (
                <Link
                  key={href}
                  href={href}
                  className={`whitespace-nowrap border-b-2 px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80 ${
                    active
                      ? "border-accent text-[#111111]"
                      : "border-transparent text-[#4a4540] hover:text-[#111111]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex shrink-0 items-center gap-2 border border-[#111111] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#111111] transition-colors hover:bg-[#f5f1ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80"
            aria-label="Søg"
          >
            <span>Søg</span>
            <Search size={14} />
          </button>
        </div>
      </nav>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
