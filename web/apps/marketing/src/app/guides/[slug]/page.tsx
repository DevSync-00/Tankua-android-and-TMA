import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, MapPin } from "lucide-react";
import { getGuide, travelGuides } from "@/lib/travel-guides";

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
  const canonicalUrl = `https://tankua.co/guides/${guide.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", "@id": `${canonicalUrl}#article`, headline: guide.title, description: guide.description, datePublished: guide.publishedAt, dateModified: guide.updatedAt, image: `https://tankua.co${guide.image}`, mainEntityOfPage: canonicalUrl, author: { "@type": "Organization", name: "Tankua Travel Team", url: "https://tankua.co/about" }, publisher: { "@id": "https://tankua.co/#organization" }, articleSection: guide.category, about: { "@type": "Place", name: guide.location }, ...(guide.sources ? { citation: guide.sources.map((source) => source.url) } : {}) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://tankua.co" },
        { "@type": "ListItem", position: 2, name: "Travel guides", item: "https://tankua.co/guides" },
        { "@type": "ListItem", position: 3, name: guide.title, item: canonicalUrl },
      ] },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#181714]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <article>
        <header className="px-5 pb-12 pt-32 sm:px-8 lg:px-12 lg:pb-16">
          <div className="mx-auto max-w-4xl">
            <Link href="/guides" className="mb-10 inline-flex items-center gap-2 text-sm font-bold text-[#181714]/65 hover:text-[#181714]"><ArrowLeft className="h-4 w-4" />All travel guides</Link>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#9a6900]">{guide.category}</p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-[-.045em] sm:text-5xl lg:text-6xl">{guide.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#181714]/68 sm:text-xl">{guide.description}</p>
            <div className="mt-7 flex flex-wrap gap-5 border-t border-black/10 pt-6 text-sm text-[#181714]/55">
              <span>By Tankua Travel Team</span><span className="flex items-center gap-2"><Clock className="h-4 w-4" />{guide.readingMinutes} min read</span><span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{guide.location}</span><time dateTime={guide.updatedAt}>Updated {new Date(`${guide.updatedAt}T00:00:00Z`).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</time>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1160px] px-5 sm:px-8"><div className="relative aspect-[16/8] overflow-hidden bg-[#ded8ca]"><Image src={guide.image} alt={guide.imageAlt} fill priority className="object-cover" sizes="(max-width: 1160px) 100vw, 1160px" /></div></div>

        <div className="mx-auto grid max-w-[1160px] gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,760px)_260px] lg:py-20">
          <div className="text-[17px] leading-8 text-[#312f2a]">
            <p className="text-xl font-medium leading-9 text-[#181714]">{guide.intro}</p>
            {guide.sections.map((section) => (
              <section key={section.heading} className="mt-12">
                <h2 className="text-3xl font-extrabold leading-tight tracking-[-.035em] text-[#181714]">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-5">{paragraph}</p>)}
                {section.bullets && <ul className="mt-6 space-y-3 border-l-4 border-[#ffb800] bg-white p-6 pl-8">{section.bullets.map((bullet) => <li key={bullet} className="list-disc pl-1">{bullet}</li>)}</ul>}
              </section>
            ))}
            {guide.sources && (
              <section className="mt-14 border-t border-black/15 pt-9" aria-labelledby="official-sources">
                <h2 id="official-sources" className="text-2xl font-extrabold tracking-[-.025em] text-[#181714]">Official sources checked</h2>
                <p className="mt-3 text-base leading-7 text-[#181714]/65">Entry, health, and security information can change. These sources were checked on {new Date(`${guide.updatedAt}T00:00:00Z`).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}.</p>
                <ul className="mt-5 space-y-3 text-base">
                  {guide.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-bold text-[#805500] underline decoration-[#ffb800] decoration-2 underline-offset-4 hover:text-[#181714]">{source.label}</a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
          <aside className="h-fit border-t-4 border-[#ffb800] bg-[#1c2119] p-7 text-white lg:sticky lg:top-28">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#ffc83d]">Continue planning</p>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight">Find a trip for {guide.location}</h2>
            <p className="mt-4 text-sm leading-6 text-white/65">Compare options from local providers and review the itinerary before booking.</p>
            <Link href={`/tours?q=${encodeURIComponent(guide.relatedTourQuery)}`} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-[#ffb800] px-5 font-bold text-[#181714]">Explore related tours <ArrowRight className="h-4 w-4" /></Link>
          </aside>
        </div>
      </article>
    </main>
  );
}
