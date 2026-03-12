import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-white text-black min-h-screen flex flex-col items-center justify-center px-4 pt-14">
      <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">
        Fejl 404
      </p>
      <h1 className="font-display text-[20vw] leading-none text-gray-100 select-none mb-2">
        404
      </h1>
      <p className="font-display text-3xl md:text-5xl leading-[0.9] mb-6 text-center">
        SIDEN FINDES IKKE
      </p>
      <p className="text-sm text-gray-500 max-w-sm text-center mb-10">
        Den side du leder efter eksisterer ikke eller er blevet flyttet.
      </p>
      <Link
        href="/"
        className="text-xs font-bold tracking-widest uppercase bg-black text-white px-8 py-4 hover:bg-gray-900 transition-colors"
      >
        TILBAGE TIL FORSIDEN
      </Link>
    </div>
  );
}
