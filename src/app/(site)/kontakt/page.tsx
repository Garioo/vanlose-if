import type { Metadata } from "next";
import KontaktForm from "@/components/KontaktForm";
import { buildPageMetadata } from "@/lib/metadata";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = buildPageMetadata({
  title: "Kontakt — Vanløse IF",
  description: "Kontakt Vanløse IF med spørgsmål om medlemskab, sponsorater eller andet.",
  path: "/kontakt",
});

export default async function KontaktPage() {
  const { data: settingsData } = await supabase.from("site_settings").select("key, value");
  const settingsMap: Record<string, string> = {};
  for (const row of settingsData ?? []) settingsMap[row.key] = row.value;

  const address = settingsMap["contact_address"] ?? "Klitmøllervej 20, 2720 Vanløse";
  const email = settingsMap["contact_email"] ?? "vanloeseif@gmail.com";
  const phone = settingsMap["contact_phone"] ?? "+45 38 74 12 12";

  const mapQuery = encodeURIComponent(address);
  const mapEmbedUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const mapDirectionsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <div className="bg-[#f7f4ef] text-[#0d0d0b] min-h-screen pt-14">
      {/* Hero */}
      <section className="border-b border-[#e0dbd3] px-4 md:px-8 py-12 md:py-16 max-w-7xl mx-auto">
        <h1 className="font-display text-5xl md:text-7xl leading-[0.9] mb-3">KONTAKT OS</h1>
        <p className="text-sm text-[#4a4540] max-w-md">
          Har du spørgsmål om medlemskab, sponsorater eller andet? Vi svarer inden for 1-2 hverdage.
        </p>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
          {/* Contact info */}
          <div>
            <h2 className="font-display text-2xl mb-8">FIND OS</h2>
            <div className="space-y-6">
              {[
                { label: "Adresse", lines: address.split(",").map((s) => s.trim()) },
                { label: "E-mail", lines: [email] },
                { label: "Telefon", lines: [phone] },
                { label: "Åbningstider", lines: ["Mandag – torsdag: 16:00 – 19:00", "Lørdag: 10:00 – 13:00"] },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#8a847c] mb-1">
                    {item.label}
                  </p>
                  {item.lines.map((line) => (
                    <p key={line} className="text-sm text-[#2e2b27]">{line}</p>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-10 overflow-hidden border border-[#e0dbd3]">
              <iframe
                title="Vanløse IF på kort"
                src={mapEmbedUrl}
                className="aspect-video w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href={mapDirectionsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#6b6560] hover:text-black"
            >
              ÅBN VEJBESKRIVELSE
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </a>
          </div>

          {/* Contact form */}
          <KontaktForm />
        </div>
      </section>
    </div>
  );
}
