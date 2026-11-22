/**
 * Curated homepage images from apps/marketing/public (avoids broken DB/remote placeholders).
 */
const KEYWORDS: readonly [needle: string, src: string][] = [
  ["simien", "/siemen.jpg"],
  ["lalibela", "/lalibela.jpg"],
  ["danakil", "/danakil%20depression.jpg"],
  ["omo", "/omo.jpg"],
  ["bale", "/bale.jpg"],
  ["harar", "/harar.png"],
];

/** Generic Ethiopia shots in /public/images when the title doesn't match. */
const FALLBACK_ROTATION = [
  "/images/eth-photo-5.jpg",
  "/images/eth-photo-6.jpg",
  "/images/eth-photo-7.jpg",
  "/images/eth-photo-2.jpg",
] as const;

export function marketingTourCardImage(tourName: string, indexForFallback = 0): string {
  const n = tourName.trim().toLowerCase();
  for (const [kw, src] of KEYWORDS) {
    if (n.includes(kw)) return src;
  }
  return FALLBACK_ROTATION[indexForFallback % FALLBACK_ROTATION.length];
}
