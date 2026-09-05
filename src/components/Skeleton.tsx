/**
 * Loading placeholders in the site palette.
 *
 * The global `prefers-reduced-motion` rule in globals.css clamps every
 * animation, so `animate-pulse` stops on its own — no extra guard needed here.
 *
 * Every skeleton is `aria-hidden` and sits inside a container that announces
 * itself once via `SkeletonScreen`, so screen readers hear "indlæser" rather
 * than a wall of empty boxes.
 */

type BlockProps = {
  className?: string;
};

/** A single shimmering block. Size it with `className`. */
export function SkeletonBlock({ className = "" }: BlockProps) {
  return <div aria-hidden className={`animate-pulse bg-[#e0dbd3] ${className}`} />;
}

/** A line of body text. `w` is a Tailwind width class. */
export function SkeletonLine({ className = "h-3 w-full" }: BlockProps) {
  return <SkeletonBlock className={className} />;
}

/** Several text lines, the last one short so it reads as a paragraph. */
export function SkeletonParagraph({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine key={i} className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

/** Placeholder for a news/article card: image on top, meta + title + excerpt below. */
export function SkeletonCard() {
  return (
    <div className="border border-[#e0dbd3]">
      <SkeletonBlock className="aspect-video w-full" />
      <div className="p-5">
        <div className="mb-3 flex items-center gap-3">
          <SkeletonBlock className="h-2.5 w-16" />
          <SkeletonBlock className="h-2.5 w-12" />
        </div>
        <SkeletonBlock className="mb-3 h-7 w-4/5" />
        <SkeletonParagraph lines={2} />
      </div>
    </div>
  );
}

/** Placeholder for a portrait tile: 3:4 image with a name underneath. */
export function SkeletonPortrait() {
  return (
    <div>
      <SkeletonBlock className="mb-3 aspect-3/4 w-full" />
      <SkeletonBlock className="mb-1.5 h-2.5 w-12" />
      <SkeletonBlock className="h-3 w-24" />
    </div>
  );
}

/** Placeholder for a bordered list of equal-height rows (standings, results, stats). */
export function SkeletonRows({ rows = 5, rowClassName = "h-11" }: { rows?: number; rowClassName?: string }) {
  return (
    <div className="divide-y divide-[#e0dbd3] border border-[#e0dbd3]">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 bg-[#f7f4ef] px-4">
          <div className={`flex flex-1 items-center gap-4 ${rowClassName}`}>
            <SkeletonBlock className="h-3 w-4" />
            <SkeletonBlock className="h-3 w-32 max-w-[45%]" />
          </div>
          <SkeletonBlock className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}

/**
 * Wraps a whole route-level skeleton. Announces a single polite "indlæser"
 * so assistive tech reports the pending navigation instead of the placeholders.
 */
export function SkeletonScreen({ children, label = "Indlæser indhold" }: { children: React.ReactNode; label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
