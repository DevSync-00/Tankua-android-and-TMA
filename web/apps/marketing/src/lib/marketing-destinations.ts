/** Shared destination cards — images live under apps/marketing/public */
export type MarketingDestination = {
  name: string;
  region: string;
  tours: number;
  from: number;
  image: string;
};

export const MARKETING_DESTINATIONS: MarketingDestination[] = [
  { name: "Simien Mountains", region: "Amhara", tours: 34, from: 8500, image: "/siemen.jpg" },
  { name: "Lalibela", region: "North Wollo", tours: 28, from: 6500, image: "/lalibela.jpg" },
  { name: "Danakil Depression", region: "Afar", tours: 16, from: 14000, image: "/danakil%20depression.jpg" },
  { name: "Omo Valley", region: "SNNPR", tours: 22, from: 9500, image: "/omo.jpg" },
  { name: "Harar Old City", region: "Harari", tours: 19, from: 5000, image: "/harar.png" },
  { name: "Bale Mountains", region: "Oromia", tours: 14, from: 7500, image: "/bale.jpg" },
];
