import Link from "next/link";
import { supabase } from "@/lib/supabase";

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

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default async function Footer() {
  const { data: settingsData } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["social_instagram", "social_facebook", "social_youtube"]);

  const s = Object.fromEntries((settingsData ?? []).map((r) => [r.key, r.value]));

  const socialLinks = [
    { key: "social_instagram", href: s["social_instagram"], label: "Instagram", Icon: InstagramIcon },
    { key: "social_facebook", href: s["social_facebook"], label: "Facebook", Icon: FacebookIcon },
    { key: "social_youtube", href: s["social_youtube"], label: "YouTube", Icon: YouTubeIcon },
  ].filter(({ href }) => href);

  return (
    <footer className="noise-overlay bg-[#141412] text-white pt-16 pb-8 px-4 md:px-8 border-t border-[#2a2825]">
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
              <p>Klitmøllervej 20 2720 Vanløse</p>
              <p>Stolt medlem af DBU.</p>
            </div>
            <p className="mt-4 text-[10px] uppercase tracking-widest text-[#5a5550]">
              Kontakt klubben for aktuelle partner- og pressehenvisninger.
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3 mt-5">
                {socialLinks.map(({ key, href, label, Icon }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-[#5a5550] hover:text-white transition-colors"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            )}
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
