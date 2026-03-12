import type { Metadata } from "next";
import Hero from "@/components/Hero";
import News from "@/components/News";
import FirstTeam from "@/components/FirstTeam";
import YouthFootball from "@/components/YouthFootball";
import Volunteer from "@/components/Volunteer";
import Newsletter from "@/components/Newsletter";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Vanløse IF - Københavns mest ambitiøse klub",
  description:
    "Vanløse IF - Stolthed & Passion. Oplev intensiteten på Vanløse Idrætspark. Siden 1921.",
  path: "/",
});

export default function Home() {
  return (
    <main>
      <Hero />
      <News />
      <FirstTeam />
      <YouthFootball />
      <Volunteer />
      <Newsletter />
    </main>
  );
}
