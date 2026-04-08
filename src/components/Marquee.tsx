"use client";

const ITEMS = [
  "STOLTHED & PASSION",
  "VANLØSE IF",
  "SIDEN 1921",
  "VANDREBANEN, KØBENHAVN",
  "VI SPILLER FOR KVARTERET",
  "VANLØSE IF",
];

export default function Marquee() {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div className="overflow-hidden bg-black py-4 select-none" aria-hidden="true">
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span key={i} className="font-display text-[2rem] leading-none text-white">
            {item}
            <span className="mx-4 text-[#dc2626]">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
