import { SkeletonBlock, SkeletonScreen } from "@/components/Skeleton";

export default function Loading() {
  return (
    <SkeletonScreen label="Indlæser spillerprofil">
      <div className="min-h-screen bg-[#f7f4ef]">
        {/* Hero — dark, so its placeholders are light-on-black */}
        <section className="relative flex min-h-[60vh] items-end overflow-hidden bg-black pt-14">
          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 md:px-8">
            <div aria-hidden className="mb-6 h-2.5 w-20 animate-pulse bg-white/15" />
            <div aria-hidden className="mb-3 h-2.5 w-24 animate-pulse bg-white/15" />
            <div aria-hidden className="mb-3 h-14 w-2/3 animate-pulse bg-white/10 md:h-20" />
            <div aria-hidden className="h-3 w-40 animate-pulse bg-white/10" />
          </div>
        </section>

        {/* Season stat boxes */}
        <section className="border-b border-[#e0dbd3] px-4 py-12 md:px-8">
          <div className="mx-auto max-w-7xl">
            <SkeletonBlock className="mb-6 h-4 w-48" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="border border-[#e0dbd3] bg-[#f7f4ef] p-5">
                  <SkeletonBlock className="mb-3 h-8 w-12" />
                  <SkeletonBlock className="h-2.5 w-16" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </SkeletonScreen>
  );
}
