import Link from "next/link";

const genveje: { label: string; href: string }[] = [
  { label: "Kampprogram", href: "/kampe" },
  { label: "Bliv Medlem", href: "/bliv-medlem" },
  { label: "Bliv Sponsor", href: "/sponsorer" },
  { label: "Kontakt Os", href: "/kontakt" },
];

const klubbenLinks: { label: string; href: string }[] = [
  { label: "Om VIF", href: "/klubben" },
  { label: "Vedtægter", href: "/klubben#vedtaegter" },
  { label: "Historie", href: "/klubben#arkiv" },
  { label: "Privatlivspolitik", href: "/privatlivspolitik" },
  { label: "Cookiepolitik", href: "/cookiepolitik" },
];

export default function Footer() {
  return (
    <footer className="bg-[#141412] text-white pt-16 pb-8 px-4 md:px-8 border-t border-[#2a2825]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Logo & Address */}
          <div className="reveal reveal-delay-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-white text-black text-xs font-black">
                V
              </div>
              <span className="font-display text-sm tracking-wider">VANLØSE IF</span>
            </Link>
            <div className="text-xs text-[#8a847c] space-y-1">
              <p>Klampegårdsvej 4-6, 2720 Vanløse</p>
              <p>Stolt medlem af DBU.</p>
            </div>
            <p className="mt-4 text-[10px] uppercase tracking-widest text-[#5a5550]">
              Kontakt klubben for aktuelle partner- og pressehenvisninger.
            </p>
          </div>

          {/* Spacer for alignment */}
          <div className="hidden md:block reveal reveal-delay-2" />

          {/* Genveje */}
          <div className="reveal reveal-delay-3">
            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#5a5550] mb-4">
              Genveje
            </h4>
            <ul className="space-y-2">
              {genveje.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-xs text-[#8a847c] hover:text-white transition-colors uppercase tracking-wider">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Klubben */}
          <div className="reveal reveal-delay-4">
            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#5a5550] mb-4">
              Klubben
            </h4>
            <ul className="space-y-2">
              {klubbenLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-xs text-[#8a847c] hover:text-white transition-colors uppercase tracking-wider">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#2a2825] pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-[10px] text-[#5a5550] uppercase tracking-wider">
            &copy; 2026 Vanløse Idræts Forening. Alle rettigheder forbeholdes.
          </p>
          <p className="text-[10px] text-[#5a5550] uppercase tracking-wider">
            Designet til sejre.
          </p>
        </div>
      </div>
    </footer>
  );
}
