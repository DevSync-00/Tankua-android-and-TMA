import { createPageMetadata } from "@/lib/seo";
export const metadata = createPageMetadata({ title: "Best Places to Visit in Ethiopia", description: "Explore Ethiopia destinations including Lalibela, the Simien Mountains, Danakil Depression, Omo Valley, Harar, and Bale Mountains.", path: "/destinations" });
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
