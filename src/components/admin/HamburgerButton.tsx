"use client";

import { useAdminSidebar } from "@/components/admin/AdminSidebarContext";

export default function HamburgerButton() {
  const { open, toggle } = useAdminSidebar();

  return (
    <button
      className="btn-press md:hidden flex h-11 w-11 -ml-3 items-center justify-center text-gray-500 hover:text-gray-700"
      onClick={toggle}
      aria-label={open ? "Luk menu" : "Åbn menu"}
      aria-expanded={open}
      aria-controls="admin-sidebar"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M3 12h18M3 6h18M3 18h18" />
      </svg>
    </button>
  );
}
