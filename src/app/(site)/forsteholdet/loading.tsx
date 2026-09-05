import { SkeletonScreen } from "@/components/Skeleton";
import { SeasonSectionsSkeleton, SquadSkeleton } from "./skeletons";

export default function Loading() {
  return (
    <SkeletonScreen label="Indlæser førsteholdet">
      <div className="min-h-screen bg-[#f7f4ef]">
        {/* Hero */}
        <section className="relative flex min-h-screen items-end overflow-hidden bg-black pt-14">
          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 md:px-8 md:pb-16">
            <div aria-hidden className="mb-4 h-2.5 w-28 animate-pulse bg-white/15" />
            <div aria-hidden className="mb-3 h-16 w-2/3 animate-pulse bg-white/10 md:h-24" />
            <div aria-hidden className="mb-8 h-16 w-1/2 animate-pulse bg-white/10 md:h-24" />
            <div aria-hidden className="h-3 w-full max-w-2xl animate-pulse bg-white/10" />
          </div>
        </section>
        <SeasonSectionsSkeleton />
        <SquadSkeleton />
      </div>
    </SkeletonScreen>
  );
}
