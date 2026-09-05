import { SkeletonBlock, SkeletonPortrait, SkeletonRows } from "@/components/Skeleton";

/** Placeholder for the results / standings / statistics / staff block. */
export function SeasonSectionsSkeleton() {
  return (
    <>
      <section className="border-b border-[#e0dbd3] bg-[#edeae3] px-4 py-12 md:px-8 md:py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <SkeletonBlock className="mb-6 h-5 w-56" />
            <div className="space-y-2">
              {Array.from({ length: 2 }, (_, i) => (
                <SkeletonBlock key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
          <div>
            <SkeletonBlock className="mb-6 h-5 w-48" />
            <SkeletonRows rows={5} />
            <SkeletonBlock className="mt-3 h-11 w-full" />
          </div>
        </div>
      </section>

      <section className="border-b border-[#e0dbd3] px-4 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl">
          <SkeletonBlock className="mb-6 h-5 w-56" />
          <SkeletonRows rows={5} />
        </div>
      </section>
    </>
  );
}

/** Placeholder for the squad grid. */
export function SquadSkeleton() {
  return (
    <section className="px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <SkeletonBlock className="mb-8 h-12 w-56 md:h-16 md:w-72" />
        <div className="mb-8 flex gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <SkeletonBlock key={i} className="h-8 w-24" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <SkeletonPortrait key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
