"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { VolunteerRole } from "@/lib/supabase";

const fallbackItems = [
  {
    title: "Træner & Holdleder",
    description:
      "Vær med til at forme næste generation på banen. Vi tilbyder uddannelse og et stærkt trænermiljø.",
  },
  {
    title: "Event & Kiosk",
    description:
      "Hjælp med at drive vores kampdagsoplevelse. Fra kiosken til events, er der altid brug for hjælpende hænder.",
  },
  {
    title: "Bestyrelse & Administration",
    description:
      "Vær med til at forme klubbens fremtid. Vi søger altid engagerede mennesker til bestyrelsen og administrationen.",
  },
];

type Props = {
  roles?: VolunteerRole[];
  imageUrl?: string | null;
};

export default function Volunteer({ roles, imageUrl }: Props) {
  const [openIndex, setOpenIndex] = useState(0);

  const items =
    roles && roles.length > 0
      ? roles.map((r) => ({ title: r.title, description: r.description }))
      : fallbackItems;

  return (
    <section className="py-16 md:py-24 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Left side */}
        <div>
          <h2 className="reveal font-display text-4xl md:text-5xl lg:text-6xl leading-[0.9] mb-4">
            Bliv en del af
            <br />
            hjertet i
            <br />
            Vanløse
          </h2>
          <p className="text-sm text-[#4a4540] mb-8 max-w-sm">
            Vanløse IF drives af passionerede frivillige. Uden jer, intet os.
          </p>

          {/* Accordion */}
          <div className="divide-y divide-[#e0dbd3] border-t border-[#e0dbd3]">
            {items.map((item, idx) => (
              <div key={item.title} className={`reveal reveal-delay-${idx + 1}`}>
                <button
                  className="w-full flex items-center justify-between py-4 text-left"
                  onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
                >
                  <span className="text-xs font-bold tracking-widest uppercase">{item.title}</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${openIndex === idx ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openIndex === idx ? "max-h-40 pb-4" : "max-h-0"
                  }`}
                >
                  <p className="text-sm text-[#4a4540]">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - CTA card */}
        <div className="flex flex-col gap-4">
          {/* Placeholder image area */}
          <div className="aspect-square bg-[#edeae3] relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url('${imageUrl || "/images/volunteer.svg"}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </div>

          {/* Dark CTA card */}
          <div className="reveal bg-[#141412] text-white p-8 md:p-10">
            <h3 className="font-display text-2xl md:text-3xl leading-[0.9] mb-4">
              Mød dem bag
              <br />
              kulisserne
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Uanset dine evner har vi en plads til dig i fællesskabet.
            </p>
            <blockquote className="border-l-2 border-white pl-4 mb-6">
              <p className="text-xs text-gray-300 italic">
                &ldquo;At være en del af VIF er mere end bare fodbold, det er et fællesskab, hvor
                man mærker lysten og det sociale sammenhold for livet.&rdquo;
              </p>
              <cite className="text-[10px] text-gray-500 not-italic mt-2 block">
                — Henrik, frivillig i 10 år
              </cite>
            </blockquote>
            <a
              href="/frivillig#tilmeld"
              className="inline-block border border-white text-white text-xs font-bold tracking-widest uppercase px-6 py-3 hover:bg-white hover:text-black transition-colors"
            >
              Bliv Frivillig
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
