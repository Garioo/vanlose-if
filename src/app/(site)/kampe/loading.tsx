import { SkeletonBlock, SkeletonRows, SkeletonScreen } from "@/components/Skeleton";

export default function Loading() {
  return (
    <SkeletonScreen label="Indlæser kampprogram">
      <div className="min-h-screen bg-[#f7f4ef] pt-14">
        <section className="mx-auto max-w-7xl border-b border-[#e0dbd3] px-4 py-12 md:px-8 md:py-16">
          <SkeletonBlock className="mb-3 h-14 w-72 md:h-20 md:w-[28rem]" />
          <SkeletonBlock className="h-3 w-56" />
        </section>

        <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
          <div className="mb-8 flex gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <SkeletonBlock key={i} className="h-8 w-28" />
            ))}
          </div>
          <SkeletonRows rows={10} rowClassName="h-14" />
        </div>
      </div>
    </SkeletonScreen>
  );
}
