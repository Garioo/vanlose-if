import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-[#f7f4ef] text-[#0d0d0b] min-h-screen flex flex-col">
      <header className="border-b border-[#e0dbd3] px-6 py-4">
        <Link href="/" className="font-display text-2xl tracking-widest hover:opacity-70 transition-opacity">
          VANLØSE IF
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#8a847c] mb-4">Fejl 404</p>
        <h1 className="font-display text-[clamp(6rem,20vw,16rem)] leading-none text-[#e0dbd3] select-none mb-4">
          404
        </h1>
        <p className="text-lg font-bold uppercase tracking-widest mb-3">
          Siden findes ikke
        </p>
        <p className="text-sm text-[#6b6560] max-w-sm mb-10">
          Den side, du leder efter, eksisterer ikke eller er blevet fjernet.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/"
            className="text-xs font-bold tracking-widest uppercase bg-black text-white px-8 py-3 hover:bg-[#1a1a18] transition-colors"
          >
            Tilbage til forsiden
          </Link>
          <Link
            href="/nyheder"
            className="text-xs font-bold tracking-widest uppercase border border-[#0d0d0b] px-8 py-3 hover:bg-[#0d0d0b] hover:text-[#f7f4ef] transition-colors"
          >
            Nyheder
          </Link>
          <Link
            href="/kampe"
            className="text-xs font-bold tracking-widest uppercase border border-[#0d0d0b] px-8 py-3 hover:bg-[#0d0d0b] hover:text-[#f7f4ef] transition-colors"
          >
            Kampe
          </Link>
        </div>
      </main>
    </div>
  );
}
