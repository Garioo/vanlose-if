import type { Metadata } from "next";
import FrivilligForm from "@/components/FrivilligForm";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Frivillig — Vanløse IF",
  description: "Bliv frivillig i Vanløse IF. Find din rolle som træner, event-hjælper eller bestyrelsesmedlem.",
  path: "/frivillig",
});

const roles = [
  {
    title: "Træner & Holdleder",
    description:
      "Del din passion for fodbold med de næste generationer. Som træner eller holdleder er du den vigtigste person i et barns sportslige liv. Vi tilbyder DBU-uddannelse og et stærkt netværk af erfarne trænere.",
    tasks: ["Ledelse af træninger", "Kampledelse og tilmelding", "Kontakt til forældre"],
  },
  {
    title: "Event & Kiosk",
    description:
      "Bag enhver god kampdag står frivillige kræfter. Vi har brug for hjælp i kiosken, ved opstilling og nedtagning af udstyr, og til at skabe den stemning, der gør Vanløse Idrætspark til noget særligt.",
    tasks: ["Kioskdrift på kampdage", "Arrangementssupport", "Dekorering og opsætning"],
  },
  {
    title: "Bestyrelse & Administration",
    description:
      "Har du kompetencer inden for økonomi, kommunikation, jura eller ledelse? Klubbens daglige drift kræver engagerede mennesker, der vil gøre en forskel bag kulisserne.",
    tasks: ["Strategisk klubudvikling", "Kommunikation og sociale medier", "Økonomi og sponsorater"],
  },
];

export default function FrivilligPage() {
  return (
    <div className="bg-white text-black min-h-screen">
      {/* Hero */}
      <section className="pt-14 min-h-screen flex items-end bg-black text-white overflow-hidden relative">
        <div className="absolute inset-0 top-14 bg-linear-to-b from-gray-800 to-black" />
        <div
          className="absolute inset-0 top-14 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 pb-16 md:pb-24">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">
            Bliv en del af fællesskabet
          </p>
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl leading-[0.85] mb-6 max-w-3xl">
            FRIVILLIG I VIF
          </h1>
          <p className="text-sm text-gray-300 mb-8 max-w-md leading-relaxed">
            Vanløse IF eksisterer takket være hundredvis af frivillige, der hver uge giver deres
            tid, energi og hjerte til klubben. Vil du være en af dem?
          </p>
          <a
            href="#roller"
            className="inline-block border border-white text-white text-xs font-bold tracking-widest uppercase px-6 py-3 hover:bg-white hover:text-black transition-colors"
          >
            SE MULIGHEDER ↓
          </a>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {[
            { value: "80+", label: "Aktive frivillige" },
            { value: "20+", label: "Års tradition" },
            { value: "1.000+", label: "Timer doneret om året" },
          ].map((stat) => (
            <div key={stat.label} className="text-center py-4 md:py-0">
              <div className="font-display text-4xl md:text-5xl mb-1">{stat.value}</div>
              <div className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Roller */}
      <section id="roller" className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="font-display text-4xl md:text-6xl leading-[0.9] mb-3">
              FIND DIN ROLLE
            </h2>
            <p className="text-sm text-gray-600 max-w-md">
              Uanset dine kompetencer og din tilgængelighed har vi en plads til dig i VIF.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div
                key={role.title}
                className="border border-gray-200 p-6 hover:border-black transition-colors group"
              >
                <div className="w-10 h-10 bg-black mb-6" />
                <h3 className="font-bold text-sm uppercase tracking-wide mb-3">{role.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-5">{role.description}</p>
                <ul className="space-y-1 mb-6">
                  {role.tasks.map((task) => (
                    <li key={task} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-1 h-1 bg-black rounded-full shrink-0" />
                      {task}
                    </li>
                  ))}
                </ul>
                <a
                  href="#tilmeld"
                  className="text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 group-hover:underline"
                >
                  Tilmeld interesse
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14m-7-7 7 7-7 7" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 md:py-20 px-4 md:px-8 bg-black text-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-display text-2xl md:text-4xl leading-snug mb-8">
            &ldquo;At være frivillig i VIF er ikke bare at hjælpe til — det er at være en del af noget
            meget større end sig selv.&rdquo;
          </p>
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
            Henrik · Frivillig i 10 år
          </p>
        </div>
      </section>

      {/* Tilmeld */}
      <section id="tilmeld" className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
          <div className="md:w-1/2">
            <h2 className="font-display text-4xl md:text-5xl leading-[0.9] mb-4">
              TILMELD DIG
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed max-w-sm">
              Udfyld formularen, og vi kontakter dig inden for et par dage for at finde den bedste
              rolle til dig.
            </p>
          </div>
          <FrivilligForm />
        </div>
      </section>
    </div>
  );
}
