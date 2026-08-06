"use client";

import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import SearchOverlay from "@/components/SearchOverlay";
import type { Match } from "@/lib/supabase";

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
      className={`flex items-center gap-2 border border-red-600 text-[10px] font-bold uppercase tracking-widest text-red-600 transition-colors hover:bg-red-600 hover:text-white ${
        compact ? "px-3 py-2" : "px-4 py-3"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
      <span className="truncate">
        {match.date}
        {match.time ? ` · ${match.time}` : ""}
      </span>
    </Link>
  );
}

export default function Navbar({ nextMatch }: NavbarProps = {}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <nav className="h-full text-black">
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded p-2 transition-colors hover:bg-[#e0dbd3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80 focus-visible:ring-offset-2"
              aria-label="Søg"
            >
              <Search size={18} />
            </button>
            <button
              className="rounded p-2 transition-colors hover:bg-[#e0dbd3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80 focus-visible:ring-offset-2 md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              <div className="space-y-1">
                <div className="w-5 h-0.5 bg-black" />
                <div className="w-5 h-0.5 bg-black" />
                <div className="w-5 h-0.5 bg-black" />
              </div>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="space-y-2 border-t border-[#e0dbd3] bg-[#f7f4ef] px-4 py-3 lg:hidden">
            {nextMatch && <MatchPill match={nextMatch} compact />}
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`block rounded px-3 py-2.5 text-sm font-bold uppercase leading-relaxed tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80 focus-visible:ring-offset-2 ${
                  pathname === href || pathname.startsWith(href + "/")
                    ? "bg-red-600 text-white"
                    : "text-[#4a4540] hover:bg-[#e0dbd3] hover:text-black"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        <div className="hidden h-16 items-center gap-5 border-b border-[#d8d2c8] bg-white px-6 lg:flex">
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
                      ? "border-[#dc2626] text-[#111111]"
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
