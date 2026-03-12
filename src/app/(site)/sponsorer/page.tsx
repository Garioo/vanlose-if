import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Sponsorer — Vanløse IF",
  description: "Vores partnere og sponsorer, der gør Vanløse IFs ambitioner mulige.",
  path: "/sponsorer",
});

const mainSponsors = [
  { tier: "HOVEDSPONSOR", name: "Sponsor A/S", since: "2022" },
  { tier: "CO-SPONSOR", name: "Partner ApS", since: "2023" },
  { tier: "CO-SPONSOR", name: "Supporter Fond", since: "2021" },
];

const partners = [
  "Lokal Partner 1",
  "Lokal Partner 2",
  "Lokal Partner 3",
  "Lokal Partner 4",
  "Lokal Partner 5",
  "Lokal Partner 6",
];

export default function SponsorerPage() {
  return (
    <div className="bg-white text-black min-h-screen pt-14">
      {/* Hero */}
      <section className="border-b border-gray-200 px-4 md:px-8 py-12 md:py-16 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">
            Samarbejdspartnere
          </p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.9] mb-3">VORES PARTNERE</h1>
          <p className="text-sm text-gray-600 max-w-md">
            Vanløse IFs ambitioner bliver mulige takket være vores trofaste sponsorer og partnere.
            Vi er stolte af hvert eneste samarbejde.
          </p>
        </div>
        <Link
          href="/kontakt"
          className="shrink-0 text-xs font-bold tracking-widest uppercase bg-black text-white px-6 py-4 hover:bg-gray-900 transition-colors self-start md:self-auto"
        >
          BLIV SPONSOR
        </Link>
      </section>

      {/* Main sponsors */}
      <section className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-10">
            Hovedsponsorer & Co-sponsorer
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mainSponsors.map((sponsor) => (
              <div
                key={sponsor.name}
                className={`border p-10 flex flex-col items-center justify-center gap-4 min-h-48 ${
                  sponsor.tier === "HOVEDSPONSOR" ? "border-black" : "border-gray-200"
                }`}
              >
                {/* Logo placeholder */}
                <div className={`w-24 h-12 ${sponsor.tier === "HOVEDSPONSOR" ? "bg-gray-200" : "bg-gray-100"}`} />
                <div className="text-center">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 block mb-1">
                    {sponsor.tier}
                  </span>
                  <h3 className="text-sm font-bold uppercase tracking-wide">{sponsor.name}</h3>
                  <p className="text-[10px] text-gray-400 mt-1">Partner siden {sponsor.since}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner grid */}
      <section className="py-12 md:py-16 px-4 md:px-8 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-10">
            Lokale partnere
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {partners.map((partner) => (
              <div
                key={partner}
                className="border border-gray-200 bg-white p-6 flex items-center justify-center min-h-20"
              >
                <div className="w-16 h-8 bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-black text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <h2 className="font-display text-3xl md:text-5xl leading-[0.9] mb-3">
              VIL DU VÆRE MED?
            </h2>
            <p className="text-sm text-gray-400 max-w-md leading-relaxed">
              Et sponsorsamarbejde med Vanløse IF giver din virksomhed synlighed over for et
              engageret lokalsamfund og over 500 aktive medlemmer.
            </p>
          </div>
          <Link
            href="/kontakt"
            className="shrink-0 text-xs font-bold tracking-widest uppercase border border-white text-white px-8 py-4 hover:bg-white hover:text-black transition-colors"
          >
            KONTAKT OS OM SPONSORAT
          </Link>
        </div>
      </section>
    </div>
  );
}
