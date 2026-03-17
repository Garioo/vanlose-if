"use client";

import Link from "next/link";
import { Search, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import SearchOverlay from "@/components/SearchOverlay";
import type { Match } from "@/lib/supabase";

const navLinks = [
  { href: "/forsteholdet", label: "Førsteholdet" },
  { href: "/ungdom", label: "Ungdom" },
  { href: "/klubben", label: "Klubben" },
  { href: "/nyheder", label: "Nyheder" },
  { href: "/kampe", label: "Kampe" },
  { href: "/frivillig", label: "Frivillig" },
];

interface NavbarProps {
  nextMatch?: Match | null;
}

export default function Navbar({ nextMatch }: NavbarProps = {}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () =>
      navRef.current?.classList.toggle("nav-scrolled", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav ref={navRef} className="border-b border-[#e0dbd3]/90 bg-[#f7f4ef]/95 text-black backdrop-blur transition-shadow duration-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80 focus-visible:ring-offset-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded bg-black text-white text-xs font-black">
              V
            </div>
            <span className="font-display text-sm tracking-wider">VANLØSE IF</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-5 md:flex">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-sm px-2 py-1 text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80 focus-visible:ring-offset-2 ${
                    active
                      ? "bg-red-600 text-white"
                      : "text-[#4a4540] hover:bg-[#e0dbd3] hover:text-black"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Næste kamp pill (desktop only) */}
          {nextMatch && (
            <Link
              href={`/kampe/${nextMatch.id}`}
              className="hidden lg:flex items-center gap-2 border border-red-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-600 hover:text-white transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
              {nextMatch.date}{nextMatch.time ? ` · ${nextMatch.time}` : ""}
            </Link>
          )}

          {/* Right side icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded p-2 transition-colors hover:bg-[#e0dbd3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80 focus-visible:ring-offset-2"
              aria-label="Søg"
            >
              <Search size={18} />
            </button>
            {/* Mobile hamburger */}
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

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="space-y-2 border-t border-[#e0dbd3] bg-[#f7f4ef] px-4 py-3 md:hidden">
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
      </nav>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
