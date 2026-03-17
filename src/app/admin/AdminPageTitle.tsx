"use client";

import { usePathname } from "next/navigation";

const titleMap: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/nyheder": "Nyheder",
  "/admin/spillere": "Spillere",
  "/admin/hold": "Hold",
  "/admin/kampe": "Kampe & Resultater",
  "/admin/live": "Livekontrol",
  "/admin/stilling": "Stilling",
  "/admin/henvendelser": "Henvendelser",
  "/admin/sponsorer": "Sponsorer",
  "/admin/ungdom": "Ungdom",
  "/admin/medlemskaber": "Medlemskaber",
  "/admin/frivillig": "Frivillig",
  "/admin/indstillinger": "Indstillinger",
};

export default function AdminPageTitle() {
  const pathname = usePathname();
  const match = Object.keys(titleMap)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname === key || pathname.startsWith(key + "/"));
  const title = match ? titleMap[match] : "Admin";
  return (
    <h1 className="font-display text-lg text-white tracking-wider">
      {title.toUpperCase()}
    </h1>
  );
}
