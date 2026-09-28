import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const routes = [
  ["", 1, "weekly"], ["/tours", 0.9, "daily"], ["/destinations", 0.9, "weekly"],
  ["/guides", 0.8, "weekly"], ["/how-it-works", 0.7, "monthly"], ["/providers", 0.7, "monthly"],
  ["/download", 0.7, "monthly"], ["/about", 0.6, "monthly"], ["/faq", 0.6, "monthly"],
  ["/contact", 0.5, "yearly"], ["/privacy", 0.3, "yearly"], ["/terms", 0.3, "yearly"],
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(([path, priority, changeFrequency]) => ({ url: `${SITE_URL}${path}`, priority, changeFrequency }));
}
