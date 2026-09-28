import type { Metadata } from "next";

export const SITE_URL = "https://tankua.co";

export function createPageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "website", siteName: "Tankua" },
    twitter: { card: "summary", title, description },
  };
}

export const privatePageMetadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};
