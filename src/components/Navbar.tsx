"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
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
        <div className="flex h-16 items-center justify-between border-b border-[#e0dbd3]/90 bg-[#f7f4ef]/95 px-4 backdrop-blur md:hidden">
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
          <div className="space-y-2 border-t border-[#e0dbd3] bg-[#f7f4ef] px-4 py-3 md:hidden">
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

        <aside
          className="hidden h-screen flex-col md:flex"
          style={{
            width: "180px",
            minWidth: "180px",
            maxWidth: "180px",
            background: "#ffffff",
            color: "#111111",
          }}
        >
          <div className="border-b border-[#d8d2c8] px-5 py-6">
            <Link
              href="/"
              className="flex flex-col items-center text-center transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <Image
                src={VIF_LOGO_URL}
                alt=""
                aria-hidden="true"
                width={62}
                height={69}
                className="h-[4.25rem] w-auto drop-shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
                priority
              />
              <p className="mt-3 font-display text-[2.05rem] leading-[0.88] tracking-tight text-[#111111]">
                Vanløse IF
              </p>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="py-2">
              {navLinks.map(({ href, label }) => {
                const active = pathname === href || pathname.startsWith(href + "/");

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`group flex items-center justify-between border-b border-[#d8d2c8] px-5 py-3.5 text-[0.72rem] font-semibold uppercase tracking-[0.22em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80 focus-visible:ring-inset ${
                      active
                        ? "bg-[#f5f1ea] text-[#111111] shadow-[inset_3px_0_0_#dc2626]"
                        : "text-[#111111] hover:bg-[#f5f1ea] hover:text-[#111111]"
                    }`}
                  >
                    <span>{label}</span>
                    <ChevronRight
                      size={14}
                      className={`transition-transform ${
                        active ? "translate-x-0 text-[#d73a45]" : "text-[#7d766f] group-hover:translate-x-0.5 group-hover:text-[#111111]"
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#d8d2c8] px-5 py-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex w-full items-center justify-between border border-[#111111] px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#111111] transition-colors hover:bg-[#f5f1ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80"
              aria-label="Søg"
            >
              <span>Søg</span>
              <Search size={14} />
            </button>

            <div className="mt-5 border-t border-[#d8d2c8] pt-4">
              <p className="text-[0.56rem] font-semibold uppercase tracking-[0.26em] text-[#7d766f]">
                Vanløse Idrætspark
              </p>
              <p className="mt-2 text-[0.72rem] leading-relaxed text-[#3d3934]">
                Klitmøllervej 20
                <br />
                2720 Vanløse
              </p>
            </div>
          </div>
        </aside>
      </nav>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
