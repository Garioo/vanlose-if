"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

export default function Hero() {
  // Next match: set to a future date
  const nextMatch = new Date();
  nextMatch.setDate(nextMatch.getDate() + 2);
  nextMatch.setHours(15, 0, 0, 0);

  const { days, hours, minutes, seconds } = useCountdown(nextMatch);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="relative h-screen min-h-[600px] flex items-end bg-black text-white overflow-hidden">
      {/* Background image placeholder */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-900 to-black"
        style={{
          backgroundImage: `url('/images/hero-field.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-black/50" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 pb-12 md:pb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
        {/* Left side - Title */}
        <div className="max-w-xl">
          <div className="inline-block bg-white text-black text-[10px] font-bold tracking-widest uppercase px-3 py-1 mb-4">
            Live fra København
          </div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.9] mb-4">
            Stolthed &<br />
            Passion
          </h1>
          <p className="text-sm md:text-base text-gray-300 mb-6 max-w-md">
            Københavns mest ambitiøse klub. Oplev intensiteten på Vanløse Idrætspark. Siden 1921.
          </p>
          <div className="flex gap-3">
            <Link
              href="/bliv-medlem"
              className="inline-block bg-white text-black text-xs font-bold tracking-widest uppercase px-6 py-3 hover:bg-gray-200 transition-colors"
            >
              Bliv Medlem
            </Link>
            <Link
              href="/kampe"
              className="inline-block border border-white text-white text-xs font-bold tracking-widest uppercase px-6 py-3 hover:bg-white/10 transition-colors"
            >
              Se Kampprogram
            </Link>
          </div>
        </div>

        {/* Right side - Next match widget */}
        <div className="bg-white text-black p-5 md:p-6 w-full md:w-80 flex-shrink-0">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-3">
            Næste Kamp
          </p>
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <div className="w-10 h-10 bg-black rounded flex items-center justify-center text-white text-xs font-bold mb-1">
                VIF
              </div>
              <span className="text-[10px] font-bold">VIF</span>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">vs</span>
            <div className="text-center">
              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-black text-xs font-bold mb-1">
                BK
              </div>
              <span className="text-[10px] font-bold">BK Frem</span>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex gap-2 mb-4">
            {[
              { value: pad(days), label: "Dage" },
              { value: pad(hours), label: "Timer" },
              { value: pad(minutes), label: "Min" },
              { value: pad(seconds), label: "Sek" },
            ].map((item) => (
              <div key={item.label} className="countdown-box flex-1">
                <div className="text-white text-lg font-bold leading-none">{item.value}</div>
                <div className="text-gray-400 text-[9px] uppercase tracking-wider mt-1">
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/kampe"
            className="block w-full bg-black text-white text-center text-xs font-bold tracking-widest uppercase py-3 hover:bg-gray-900 transition-colors"
          >
            Køb Billet
          </Link>
        </div>
      </div>
    </section>
  );
}
