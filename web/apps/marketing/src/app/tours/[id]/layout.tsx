import type { Metadata } from "next";
import { getTourById } from "@/lib/queries";
import { SITE_URL } from "@/lib/seo";

type Props = { children: React.ReactNode; params: { id: string } };

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const tour = await getTourById(params.id);
  const path = `/tours/${encodeURIComponent(params.id)}`;

  if (!tour) {
    return { title: "Tour Not Found", robots: { index: false, follow: false } };
  }

  const description = tour.description
    ? tour.description.slice(0, 155)
    : `Explore ${tour.name} in ${tour.location}, Ethiopia, and book with a trusted local provider on Tankua.`;

  return {
    title: `${tour.name} Tour`,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${tour.name} Tour`, description, url: path, type: "website", siteName: "Tankua" },
    twitter: { card: "summary", title: `${tour.name} Tour`, description },
  };
}

export default async function TourLayout({ children, params }: Props) {
  const tour = await getTourById(params.id);
  const path = `${SITE_URL}/tours/${encodeURIComponent(params.id)}`;
  const structuredData = tour ? {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.name,
    description: tour.description || `A guided tour of ${tour.name} in Ethiopia.`,
    url: path,
    touristType: tour.category,
    itinerary: { "@type": "Place", name: tour.location, address: { "@type": "PostalAddress", addressCountry: "ET" } },
    offers: { "@type": "Offer", price: tour.price, priceCurrency: "ETB", url: path },
    provider: tour.provider?.name ? { "@type": "Organization", name: tour.provider.name } : { "@id": `${SITE_URL}/#organization` },
  } : null;

  return (
    <>
      {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />}
      {children}
    </>
  );
}
