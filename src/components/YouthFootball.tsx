import Image from "next/image";

export default function YouthFootball() {
  return (
    <section className="py-16 md:py-24 bg-[#edeae3]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left: Image */}
          <div className="reveal relative aspect-[4/3] bg-[#ddd8d0] overflow-hidden">
            <Image
              src="/images/youth.svg"
              alt="Ungdomsfodbold"
              fill
              className="object-cover"
            />
          </div>

          {/* Right: Content */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#6b6560] mb-3">
              Talentfabrikken
            </p>
            <h2 className="reveal font-display text-4xl md:text-5xl lg:text-6xl leading-[0.9] mb-4">
              Ungdoms-
              <br />
              fodbold
            </h2>
            <p className="text-sm text-[#4a4540] mb-8 max-w-sm">
              Vi skaber fremtidens stjerner. Med over 800 aktive ungdomsspillere er Vanløse IF et af
              Danmarks stærkeste fundamenter for talentudvikling og fællesskab.
            </p>

            <div className="flex gap-12 mb-8">
              <div className="reveal reveal-delay-1">
                <span className="font-display text-4xl md:text-5xl">800+</span>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#6b6560] mt-1">
                  Aktive Spillere
                </p>
              </div>
              <div className="reveal reveal-delay-2">
                <span className="font-display text-4xl md:text-5xl">45+</span>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#6b6560] mt-1">
                  Holdledere
                </p>
              </div>
            </div>

            <a
              href="/ungdom#tilmelding"
              className="inline-block border-2 border-black text-black text-xs font-bold tracking-widest uppercase px-6 py-3 hover:bg-black hover:text-white transition-colors"
            >
              Tilmeld Dit Barn
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
