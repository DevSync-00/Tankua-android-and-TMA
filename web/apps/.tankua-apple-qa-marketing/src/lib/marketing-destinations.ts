/** Shared destination cards — images live under apps/marketing/public */
export type MarketingDestination = {
  name: string;
  region: string;
  image: string;
};

export const MARKETING_DESTINATIONS: MarketingDestination[] = [
  { name: "Simien Mountains", region: "Amhara", image: "/siemen.jpg" },
  { name: "Lalibela", region: "North Wollo", image: "/lalibela.jpg" },
  { name: "Danakil Depression", region: "Afar", image: "/danakil%20depression.jpg" },
  { name: "Omo Valley", region: "SNNPR", image: "/omo.jpg" },
  { name: "Harar Old City", region: "Harari", image: "/harar.png" },
  { name: "Bale Mountains", region: "Oromia", image: "/bale.jpg" },
];
