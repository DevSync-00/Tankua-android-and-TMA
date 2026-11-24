import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getTripPromotionChannel, richTextToPlain } from "@tankua/ui";
import { getTourById } from "@/lib/queries";
import { SITE_URL } from "@/lib/seo";
import TourDetail from "./TourDetail";

export const dynamic = "force-dynamic";

const tourIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: { id: string };
  searchParams: { from?: string | string[]; channel?: string | string[] };
};

const requireTour = cache(async (id: string) => {
  if (!tourIdPattern.test(id)) notFound();

  const tour = await getTourById(id);
  if (!tour) notFound();
  return tour;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tour = await requireTour(params.id);
  const path = `/tours/${encodeURIComponent(tour.id)}`;
  const title = `${tour.name} Tour`;
  const plain = richTextToPlain(tour.description);
  const description = plain
    ? plain.slice(0, 155)
    : `Explore ${tour.name} in ${tour.location}, Ethiopia, with a local provider on Tankua.`;

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: tour.indexable ? undefined : { index: false, follow: true },
    openGraph: { title, description, url: path, type: "website", siteName: "Tankua" },
    twitter: { card: "summary", title, description },
  };
}

export default async function TourPage({ params, searchParams }: Props) {
  const tour = await requireTour(params.id);
  const url = `${SITE_URL}/tours/${encodeURIComponent(tour.id)}`;
  const requestedFrom = typeof searchParams.from === "string" ? searchParams.from : searchParams.from?.[0];
  const from = requestedFrom === "/tours" || requestedFrom?.startsWith("/tours?") ? requestedFrom : null;
  const requestedChannel = typeof searchParams.channel === "string" ? searchParams.channel : searchParams.channel?.[0];
  const channel = getTripPromotionChannel(requestedChannel ?? null);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.name,
    description: richTextToPlain(tour.description) || `A guided tour of ${tour.name} in Ethiopia.`,
    url,
    touristType: tour.category,
    itinerary: { "@type": "Place", name: tour.location, address: { "@type": "PostalAddress", addressCountry: "ET" } },
    ...(tour.bookingOpen && tour.price !== null && {
      offers: { "@type": "Offer", price: tour.price, priceCurrency: tour.currency, url },
    }),
    provider: tour.provider?.name ? { "@type": "Organization", name: tour.provider.name } : { "@id": `${SITE_URL}/#organization` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <TourDetail key={`${tour.id}:${from ?? ""}`} tour={tour} from={from} channel={channel} />
    </>
  );
}
