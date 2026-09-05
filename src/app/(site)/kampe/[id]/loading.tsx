import { SkeletonBlock, SkeletonScreen } from "@/components/Skeleton";

export default function Loading() {
  return (
    <SkeletonScreen label="Indlæser kampcenter">
      <div className="min-h-screen bg-[#f7f4ef] pt-14">
        {/* Back link */}
        <div className="mx-auto max-w-7xl px-4 pb-4 pt-8 md:px-8">
          <SkeletonBlock className="h-2.5 w-36" />
        </div>

        {/* Scoreboard hero — matches the navy gradient card in MatchCenterClient */}
        <section className="mx-auto max-w-7xl px-4 pb-8 md:px-8">
          <div
            className="relative overflow-hidden"
            style={{ background: "linear-gradient(160deg, #0a1523 0%, #12283f 60%, #0a1523 100%)" }}
          >
            <div className="absolute inset-x-0 top-0 h-[3px] bg-[var(--accent-bright)]" />
            <div className="relative px-6 py-8 md:px-10 md:py-10">
              <div aria-hidden className="mb-6 h-6 w-24 animate-pulse bg-white/15" />
              <div className="flex items-center justify-between gap-6">
                {/* Home */}
                <div className="flex flex-1 flex-col items-center gap-3">
                  <div aria-hidden className="h-14 w-14 animate-pulse bg-white/10 md:h-20 md:w-20" />
                  <div aria-hidden className="h-3 w-20 animate-pulse bg-white/15" />
                </div>
                {/* Score */}
                <div aria-hidden className="h-14 w-28 shrink-0 animate-pulse bg-white/10 md:h-20 md:w-40" />
                {/* Away */}
                <div className="flex flex-1 flex-col items-center gap-3">
                  <div aria-hidden className="h-14 w-14 animate-pulse bg-white/10 md:h-20 md:w-20" />
                  <div aria-hidden className="h-3 w-20 animate-pulse bg-white/15" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
          <SkeletonBlock className="mb-6 h-4 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 border border-[#e0dbd3] bg-white/40 px-4 py-3">
                <SkeletonBlock className="h-3 w-8" />
                <SkeletonBlock className="h-3 w-3 rounded-full" />
                <SkeletonBlock className="h-3 w-40 max-w-[50%]" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </SkeletonScreen>
  );
}
