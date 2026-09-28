import { createPageMetadata } from "@/lib/seo";
export const metadata = createPageMetadata({ title: "Ethiopia Travel Guides", description: "Practical guides and local inspiration for planning tours, cultural journeys, treks, and holidays across Ethiopia.", path: "/guides" });
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
