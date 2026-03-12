"use client";

import Link from "next/link";
import { Search, User } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import SearchOverlay from "@/components/SearchOverlay";

const navLinks = [
  { href: "/forsteholdet", label: "Førsteholdet" },
  { href: "/ungdom", label: "Ungdom" },
  { href: "/klubben", label: "Klubben" },
  { href: "/nyheder", label: "Nyheder" },
  { href: "/kampe", label: "Kampe" },
  { href: "/frivillig", label: "Frivillig" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white text-black border-b border-gray-200">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-black text-white text-xs font-black">
              V
            </div>
            <span className="font-display text-sm tracking-wider">VANLØSE IF</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-xs font-bold tracking-widest uppercase transition-colors ${
                    active ? "text-black underline underline-offset-4" : "text-gray-400 hover:text-black"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              aria-label="Søg"
            >
              <Search size={18} />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition-colors" aria-label="Log ind">
              <User size={18} />
            </button>
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
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
          <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-4">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`block text-sm font-bold tracking-widest uppercase ${
                  pathname === href ? "text-black" : "text-gray-400"
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
