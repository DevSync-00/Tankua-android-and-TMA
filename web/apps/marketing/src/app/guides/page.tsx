import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { travelGuides } from "@/lib/travel-guides";

export default function GuidesPage() {
  const [featured, ...guides] = travelGuides;
  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#181714]">
      <header className="border-b border-black/10 bg-[#1c2119] px-5 pb-16 pt-32 text-white sm:px-8 lg:px-12 lg:pb-20">
        <div className="mx-auto max-w-[1440px]">
          <p className="mb-4 text-xs font-bold uppercase tracking-[.22em] text-[#ffc83d]">Plan with local context</p>
          <h1 className="max-w-4xl text-4xl font-extrabold tracking-[-.04em] sm:text-5xl lg:text-6xl">Ethiopia travel guides</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">Practical advice for choosing when to go, preparing for the journey, and traveling with respect.</p>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <Link href={`/guides/${featured.slug}`} className="group grid overflow-hidden bg-white shadow-[0_18px_60px_rgba(0,0,0,.08)] lg:grid-cols-[1.2fr_1fr]">
          <div className="relative min-h-[340px] lg:min-h-[520px]">
            <Image src={featured.image} alt={featured.imageAlt} fill priority className="object-cover transition duration-700 group-hover:scale-[1.025]" sizes="(max-width: 1024px) 100vw, 58vw" />
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9a6900]">Featured guide · {featured.category}</p>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-[-.035em] sm:text-4xl">{featured.title}</h2>
            <p className="mt-5 text-base leading-7 text-[#181714]/68">{featured.description}</p>
            <div className="mt-7 flex flex-wrap gap-5 text-sm text-[#181714]/58"><span className="flex items-center gap-2"><Clock className="h-4 w-4" />{featured.readingMinutes} min read</span><span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{featured.location}</span></div>
            <span className="mt-9 inline-flex items-center gap-2 font-bold">Read the guide <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </div>
        </Link>

        <section className="pt-16 lg:pt-24" aria-labelledby="all-guides">
          <div className="mb-9 flex items-end justify-between gap-5"><div><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[#9a6900]">Explore Ethiopia</p><h2 id="all-guides" className="text-3xl font-extrabold tracking-[-.035em] sm:text-4xl">More practical guides</h2></div><Link href="/tours" className="hidden items-center gap-2 font-bold sm:inline-flex">Browse tours <ArrowRight className="h-4 w-4" /></Link></div>
          <div className="grid gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
            {guides.map((guide) => (
              <article key={guide.slug} className="group">
                <Link href={`/guides/${guide.slug}`} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#ddd8cd]"><Image src={guide.image} alt={guide.imageAlt} fill className="object-cover transition duration-700 group-hover:scale-[1.035]" sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" /></div>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-[#9a6900]">{guide.category}</p>
                  <h3 className="mt-3 text-2xl font-extrabold leading-snug tracking-[-.025em] group-hover:underline group-hover:decoration-[#ffb800] group-hover:underline-offset-4">{guide.title}</h3>
                  <p className="mt-3 line-clamp-3 text-base leading-7 text-[#181714]/65">{guide.description}</p>
                  <div className="mt-4 flex gap-4 text-sm text-[#181714]/52"><span>{guide.readingMinutes} min read</span><span>{guide.location}</span></div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
