import Link from "next/link";
import AdminSidebar from "@/app/admin/AdminSidebar";
import AdminPageTitle from "@/app/admin/AdminPageTitle";
import LogoutButton from "@/app/admin/LogoutButton";

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex">
      <AdminSidebar />

      {/* Main */}
      <div className="flex-1 ml-52 min-h-screen flex flex-col">
        {/* Topbar */}
        <header className="h-14 border-b border-gray-200 px-6 md:px-8 flex items-center justify-between bg-white sticky top-0 z-40">
          <AdminPageTitle />
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-gray-400 hover:text-gray-500 text-[10px] tracking-widest uppercase transition-colors flex items-center gap-1.5"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5m7 7-7-7 7-7" />
              </svg>
              Til sitet
            </Link>
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
