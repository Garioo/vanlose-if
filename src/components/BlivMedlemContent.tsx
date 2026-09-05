import { mailtoUrl, telUrl } from "@/lib/site-contact";
import type { MembershipTier } from "@/lib/supabase";

interface Props {
  tiers: MembershipTier[];
  email: string;
  phone: string;
}

export default function BlivMedlemContent({ tiers, email, phone }: Props) {
  return (
    <section className="py-16 md:py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h2 className="font-display text-4xl md:text-5xl leading-[0.9] mb-3">VÆLG MEDLEMSKAB</h2>
          {tiers.length > 0 && (
            <p className="text-sm text-[#4a4540]">Alle priser er pr. sæson og gælder for 2026.</p>
          )}
        </div>

        {/* Uden medlemstyper i databasen viste siden et tomt gitter under en
            overskrift om priser. Henvis til klubben i stedet. */}
        {tiers.length === 0 && (
          <div className="border border-[#e0dbd3] p-8 mb-16 max-w-xl">
            <p className="text-sm text-[#4a4540] mb-4">
              Kontingentsatserne for den kommende sæson er ikke offentliggjort endnu. Skriv eller
              ring til klubben, så fortæller vi hvad et medlemskab koster for din aldersgruppe.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={mailtoUrl(email, "Medlemskab")}
                className="inline-block bg-black text-white text-xs font-bold tracking-widest uppercase px-6 py-3 hover:bg-gray-900 transition-colors"
              >
                Skriv til os
              </a>
              <a
                href={telUrl(phone)}
                className="inline-block border border-[#e0dbd3] text-xs font-bold tracking-widest uppercase px-6 py-3 hover:border-black transition-colors"
              >
                Ring til klubben
              </a>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`border p-8 flex flex-col ${
                tier.featured ? "border-black bg-black text-white" : "border-[#e0dbd3]"
              }`}
            >
              {tier.featured && (
                <span className="text-[10px] font-bold tracking-widest uppercase bg-white text-black px-2 py-1 self-start mb-4">
                  Mest valgt
                </span>
              )}
              <h3 className="font-display text-3xl mb-1">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-display text-5xl">{tier.price}</span>
                <span className={`text-xs ${tier.featured ? "text-gray-400" : "text-gray-500"}`}>{tier.unit}</span>
              </div>
              <p className={`text-xs mb-6 leading-relaxed ${tier.featured ? "text-gray-300" : "text-gray-500"}`}>
                {tier.description}
              </p>
              <ul className="space-y-2 mb-8 flex-1">
                {tier.perks.map((perk) => (
                  <li key={perk} className={`flex items-start gap-2 text-xs ${tier.featured ? "text-gray-200" : "text-gray-600"}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="mt-0.5 shrink-0">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {perk}
                  </li>
                ))}
              </ul>
              <a
                href={mailtoUrl(email, `Medlemskab — ${tier.name}`)}
                className={`text-xs font-bold tracking-widest uppercase py-3 text-center transition-colors ${
                  tier.featured
                    ? "bg-white text-black hover:bg-gray-100"
                    : "border border-black hover:bg-black hover:text-white"
                }`}
              >
                Vælg {tier.name}
              </a>
            </div>
          ))}
        </div>

        {/* Sådan bliver du medlem */}
        <div id="tilmeld" className="max-w-2xl mx-auto border-t border-[#e0dbd3] pt-12">
          <h2 className="font-display text-3xl mb-4">SÅDAN BLIVER DU MEDLEM</h2>
          <p className="text-sm text-[#4a4540] leading-relaxed mb-8">
            Skriv til os med dit navn, telefonnummer og hvilket medlemskab du ønsker — så sender vi
            dig det videre forløb. Vi svarer inden for 1-2 hverdage.
          </p>
          <a
            href={mailtoUrl(email, "Jeg vil gerne være medlem af Vanløse IF")}
            className="inline-flex items-center gap-2 bg-black text-white text-xs font-bold tracking-widest uppercase px-8 py-4 hover:bg-[#2e2b27] transition-colors"
          >
            SKRIV TIL OS
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14m-7-7 7 7-7 7" />
            </svg>
          </a>
          <p className="mt-6 text-sm text-[#2e2b27]">{email}</p>
          <p className="mt-1 text-xs text-[#6b6560]">
            Eller ring på{" "}
            <a href={telUrl(phone)} className="underline underline-offset-4 decoration-[#c9c3ba] hover:decoration-black">
              {phone}
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
