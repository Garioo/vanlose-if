import { SkeletonBlock, SkeletonParagraph, SkeletonScreen } from "@/components/Skeleton";

export default function Loading() {
  return (
    <SkeletonScreen label="Indlæser artikel">
      <div className="min-h-screen bg-[#f7f4ef] pt-14">
        {/* Article hero */}
        <section className="mx-auto max-w-3xl border-b border-[#e0dbd3] px-4 py-12 md:px-8 md:py-20">
          <SkeletonBlock className="mb-8 h-2.5 w-40" />
          <div className="mb-4 flex items-center gap-3">
            <SkeletonBlock className="h-2.5 w-14" />
            <SkeletonBlock className="h-2.5 w-20" />
            <SkeletonBlock className="h-2.5 w-16" />
          </div>
          <SkeletonBlock className="mb-3 h-12 w-full md:h-16" />
          <SkeletonBlock className="mb-6 h-12 w-3/4 md:h-16" />
          <div className="border-l-2 border-[#e0dbd3] pl-4">
            <SkeletonParagraph lines={2} />
          </div>
        </section>

        {/* Hero image */}
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
          <SkeletonBlock className="aspect-video w-full" />
        </div>

        {/* Body */}
        <article className="mx-auto max-w-3xl px-4 py-12 md:px-8">
          <SkeletonParagraph lines={4} className="mb-8" />
          <SkeletonParagraph lines={5} className="mb-8" />
          <SkeletonParagraph lines={3} />
        </article>
      </div>
    </SkeletonScreen>
  );
}
