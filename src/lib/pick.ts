/**
 * Whitelist copy: returns a new object containing only the listed keys that are
 * actually present on `source`. Guards admin write routes against mass-assignment —
 * columns like `id` / `created_at` (or anything an attacker injects) never reach the
 * database. Keys absent from `source` are omitted (not set to undefined), so partial
 * updates from the admin UI keep working unchanged.
 */
export function pick<T = Record<string, unknown>>(
  source: unknown,
  keys: readonly string[],
): Partial<T> {
  const src = (source ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(src, key)) {
      out[key] = src[key];
    }
  }
  return out as Partial<T>;
}
