import Link from "next/link";

const genveje: { label: string; href: string }[] = [
  { label: "Kampprogram", href: "/kampe" },
  { label: "Køb Merchandise", href: "/bliv-medlem" },
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
    <footer className="bg-gray-100 text-black pt-16 pb-8 px-4 md:px-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Logo & Address */}
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-black text-white text-xs font-black">
                V
              </div>
              <span className="font-display text-sm tracking-wider">VANLØSE IF</span>
            </Link>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Klampegårdsvej 4-6, 2720 Vanløse</p>
              <p>CVR: 12345678.</p>
              <p>Stolt medlem af DBU.</p>
            </div>
            <div className="flex gap-3 mt-4">
              {/* X (Twitter) icon */}
              <a href="/kontakt" className="text-gray-500 hover:text-black transition-colors" aria-label="X / Twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* Instagram icon */}
              <a href="/kontakt" className="text-gray-500 hover:text-black transition-colors" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>
          </div>

          {/* Spacer for alignment */}
          <div className="hidden md:block" />

          {/* Genveje */}
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 mb-4">
              Genveje
            </h4>
            <ul className="space-y-2">
              {genveje.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-xs text-gray-500 hover:text-black transition-colors uppercase tracking-wider">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Klubben */}
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 mb-4">
              Klubben
            </h4>
            <ul className="space-y-2">
              {klubbenLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-xs text-gray-500 hover:text-black transition-colors uppercase tracking-wider">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-300 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">
            &copy; 2026 Vanløse Idræts Forening. Alle rettigheder forbeholdes.
          </p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">
            Designet til sejre.
          </p>
        </div>
      </div>
    </footer>
  );
}
