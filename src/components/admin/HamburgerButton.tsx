"use client";

import { useAdminSidebar } from "@/components/admin/AdminSidebarContext";

export default function HamburgerButton() {
  const { toggle } = useAdminSidebar();

  return (
    <button
      className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700"
      onClick={toggle}
      aria-label="Åbn menu"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M3 12h18M3 6h18M3 18h18" />
      </svg>
    </button>
  );
}
