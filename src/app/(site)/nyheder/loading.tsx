import { SkeletonBlock, SkeletonCard, SkeletonScreen } from "@/components/Skeleton";

export default function Loading() {
  return (
    <SkeletonScreen label="Indlæser nyheder">
      <div className="min-h-screen bg-[#f7f4ef] pt-14">
        <section className="mx-auto max-w-7xl border-b border-[#e0dbd3] px-4 py-12 md:px-8 md:py-16">
          <SkeletonBlock className="mb-3 h-14 w-64 md:h-20 md:w-96" />
          <SkeletonBlock className="h-3 w-80 max-w-full" />
        </section>

        <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
          {/* Category tabs */}
          <div className="mb-8 flex gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <SkeletonBlock key={i} className="h-8 w-20" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </SkeletonScreen>
  );
}
