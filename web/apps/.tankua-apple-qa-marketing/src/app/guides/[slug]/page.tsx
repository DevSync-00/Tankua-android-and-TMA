import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, MapPin } from "lucide-react";
import { getGuide, travelGuides } from "@/lib/travel-guides";
import { SITE_URL } from "@/lib/seo";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return travelGuides.map(({ slug }) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const guide = getGuide(params.slug);
  if (!guide) return { title: "Guide Not Found", robots: { index: false, follow: false } };
  const path = `/guides/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: path },
    openGraph: { title: guide.title, description: guide.description, url: path, type: "article", publishedTime: guide.publishedAt, modifiedTime: guide.updatedAt, siteName: "Tankua" },
    twitter: { card: "summary", title: guide.title, description: guide.description },
  };
}

export default function GuidePage({ params }: Props) {
  const guide = getGuide(params.slug);
  if (!guide) notFound();
  const canonicalUrl = `${SITE_URL}/guides/${guide.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", "@id": `${canonicalUrl}#article`, headline: guide.title, description: guide.description, datePublished: guide.publishedAt, dateModified: guide.updatedAt, image: `${SITE_URL}${guide.image}`, mainEntityOfPage: canonicalUrl, author: { "@type": "Organization", name: "Tankua Travel Team", url: `${SITE_URL}/about` }, publisher: { "@id": `${SITE_URL}/#organization` }, articleSection: guide.category, about: { "@type": "Place", name: guide.location }, ...(guide.sources ? { citation: guide.sources.map((source) => source.url) } : {}) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Travel guides", item: `${SITE_URL}/guides` },
        { "@type": "ListItem", position: 3, name: guide.title, item: canonicalUrl },
      ] },
    ],
  };

  return (
    <main className="field-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <article>
        <header className="field-wrap pb-10 pt-8 sm:pt-12 lg:pb-14">
          <div className="max-w-4xl">
            <Link href="/guides" className="field-link mb-4"><ArrowLeft size={17} aria-hidden="true" />All travel guides</Link>
            <h1 className="field-display field-display--detail">{guide.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--field-muted)] sm:text-xl">{guide.description}</p>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 border-t border-[var(--field-line)] pt-5 text-sm text-[var(--field-muted)]">
              <span>By Tankua Travel Team</span><span className="flex items-center gap-2"><Clock size={16} aria-hidden="true" />{guide.readingMinutes} min read</span><span className="flex items-center gap-2"><MapPin size={16} aria-hidden="true" />{guide.location}</span><time dateTime={guide.updatedAt}>Updated {new Date(`${guide.updatedAt}T00:00:00Z`).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</time>
            </div>
          </div>
        </header>

        <div className="field-wrap"><div className="relative aspect-[9/7] overflow-hidden bg-[var(--field-wash)] sm:aspect-[2/1]"><Image src={guide.image} alt={guide.imageAlt} fill priority className="object-cover" sizes="(max-width: 1280px) 100vw, 1280px" /></div></div>

        <div className="field-wrap grid gap-12 py-10 sm:py-14 lg:grid-cols-[minmax(0,760px)_minmax(14rem,1fr)] lg:gap-20 lg:py-20">
          <div className="max-w-[72ch] text-[17px] leading-8">
            <p className="text-xl font-medium leading-9">{guide.intro}</p>
            {guide.sections.map((section) => (
              <section key={section.heading} className="mt-12">
                <h2 className="field-display">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-5">{paragraph}</p>)}
                {section.bullets && <ul className="mt-6 space-y-3 border border-[var(--field-line)] bg-[var(--field-wash)] p-6 pl-8">{section.bullets.map((bullet) => <li key={bullet} className="list-disc pl-1">{bullet}</li>)}</ul>}
              </section>
            ))}
            {guide.sources && (
              <section className="mt-14 border-t border-[var(--field-line)] pt-9" aria-labelledby="official-sources">
                <h2 id="official-sources" className="field-display">Official sources checked</h2>
                <p className="mt-3 text-base leading-7 text-[var(--field-muted)]">Entry, health, and security information can change. These sources were checked on {new Date(`${guide.updatedAt}T00:00:00Z`).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}.</p>
                <ul className="mt-5 space-y-3 text-base">
                  {guide.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="field-link">{source.label}</a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
          <aside className="h-fit border border-[var(--field-line)] bg-[var(--field-wash)] p-6 lg:sticky lg:top-24">
            <h2 className="text-xl font-semibold leading-tight">Tours in {guide.location}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--field-muted)]">Compare options from local providers and review the itinerary before booking.</p>
            <Link href={`/tours?q=${encodeURIComponent(guide.relatedTourQuery)}`} className="field-button mt-5">Find related tours<ArrowRight size={17} aria-hidden="true" /></Link>
          </aside>
        </div>
      </article>
    </main>
  );
}
