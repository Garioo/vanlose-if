import { SkeletonBlock, SkeletonCard } from "@/components/Skeleton";

/** Placeholder for the home page's news strip while its query resolves. */
export default function NewsSkeleton() {
  return (
    <section
      className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Indlæser nyheder</span>
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-4xl leading-[0.9] md:text-6xl lg:text-7xl">Nyheder</h2>
          <SkeletonBlock className="mt-3 h-3 w-72 max-w-full" />
        </div>
        <SkeletonBlock className="mt-4 h-3 w-28 md:mt-0" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  );
}
