import { WORDS_PER_MINUTE } from "./constants";

export function readingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, " ");
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / WORDS_PER_MINUTE));
}
