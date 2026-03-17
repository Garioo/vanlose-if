"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <button
      onClick={logout}
      className="text-[10px] font-bold tracking-widest uppercase px-3 py-2 text-[#5a5550] hover:text-[#a09890] transition-colors"
    >
      Log ud
    </button>
  );
}
