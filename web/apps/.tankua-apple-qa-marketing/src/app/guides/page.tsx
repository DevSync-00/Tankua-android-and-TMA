import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { travelGuides } from "@/lib/travel-guides";

export default function GuidesPage() {
  const [featured, ...guides] = travelGuides;

  return (
    <main className="field-page">
      <div className="field-wrap py-12 sm:py-16 lg:py-20">
        <header className="mb-9 border-b border-[var(--field-line)] pb-8 sm:mb-12">
          <h1 className="field-display">Ethiopia travel guides</h1>
          <p className="mt-4 max-w-[48ch] text-base leading-7 text-[var(--field-muted)] sm:text-lg">
            Plan when to go, what to bring, and how to get around. Get to know Ethiopia’s food, coffee, and customs before you leave.
          </p>
        </header>

        <Link href={`/guides/${featured.slug}`} className="field-guide-feature group grid border-b border-[var(--field-line)] pb-10 lg:grid-cols-[1.2fr_1fr] lg:pb-12">
          <div className="relative aspect-[5/4] overflow-hidden bg-[var(--field-wash)] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[28rem]">
            <Image src={featured.image} alt={featured.imageAlt} fill priority className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="(max-width: 1023px) 100vw, 56vw" />
          </div>
          <div className="flex flex-col justify-center py-6 lg:py-10 lg:pl-12 xl:pl-16">
            <h2 className="field-display">{featured.title}</h2>
            <p className="mt-5 max-w-[46ch] leading-7 text-[var(--field-muted)]">{featured.description}</p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--field-muted)]">
              <span className="flex items-center gap-2"><Clock size={16} aria-hidden="true" />{featured.readingMinutes} min read</span>
              <span className="flex items-center gap-2"><MapPin size={16} aria-hidden="true" />{featured.location}</span>
            </div>
            <span className="field-link mt-4">Read the guide <ArrowRight size={17} aria-hidden="true" /></span>
          </div>
        </Link>

        <section className="pt-10 sm:pt-14 lg:pt-16" aria-labelledby="all-guides">
          <div className="field-catalog-heading mb-7">
            <h2 id="all-guides" className="field-display">More travel guides</h2>
            <Link href="/tours" className="field-link">Browse tours<ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
          <div className="field-cards">
            {guides.map((guide) => (
              <article key={guide.slug} className="field-card">
                <Link href={`/guides/${guide.slug}`} className="field-card-link">
                  <div className="field-card-image"><Image src={guide.image} alt={guide.imageAlt} fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 390px" /></div>
                  <div className="field-card-body">
                    <h3>{guide.title}</h3>
                    <p className="field-card-description">{guide.description}</p>
                    <div className="field-card-end">
                      <p><span>{guide.readingMinutes} min read · {guide.location}</span></p>
                      <span className="field-card-action"><ArrowRight size={17} aria-hidden="true" /></span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
