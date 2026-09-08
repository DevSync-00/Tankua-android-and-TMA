import Link from "next/link";
import { ArrowRight, Users, Shield } from "lucide-react";

export default function GuidesPage() {
  return (
    <main className="min-h-screen bg-brand-sand">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-2xl mb-12">
          <p className="font-mono text-[11px] text-brand-gold uppercase tracking-[0.2em] mb-3">Local expertise</p>
          <h1 className="font-syne font-bold text-[32px] md:text-[40px] text-brand-ink mb-4">
            Guides on Tankua
          </h1>
          <p className="text-[15px] text-brand-muted leading-relaxed mb-8">
            We work with Ethiopian-born guides across every region on the platform. Listings are verified, and travelers book with ETB-friendly pricing.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tours"
              className="inline-flex items-center gap-2 h-[42px] px-5 rounded-[10px] bg-brand-gold text-brand-ink font-medium text-[14px] shadow-[0_2px_8px_rgba(245,168,0,0.3)]"
            >
              Explore tours <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/providers"
              className="inline-flex items-center gap-2 h-[42px] px-5 rounded-[10px] border-[1.5px] border-brand-ink/15 text-brand-ink font-medium text-[14px] hover:bg-white/80 transition-colors"
            >
              List your tours as a provider
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
          <div className="bg-brand-cream border border-[rgba(245,168,0,0.15)] rounded-[14px] p-6">
            <div className="w-10 h-10 rounded-full bg-brand-gold/15 flex items-center justify-center mb-4">
              <Users className="h-5 w-5 text-brand-gold-dark" />
            </div>
            <h2 className="font-syne font-bold text-[17px] text-brand-ink mb-2">For travelers</h2>
            <p className="font-dm text-[14px] text-brand-muted leading-relaxed">
              Choose a tour and meet your guide through the itinerary and provider profile. Ratings and ETB pricing are shown upfront.
            </p>
          </div>
          <div className="bg-brand-cream border border-[rgba(245,168,0,0.15)] rounded-[14px] p-6">
            <div className="w-10 h-10 rounded-full bg-brand-gold/15 flex items-center justify-center mb-4">
              <Shield className="h-5 w-5 text-brand-gold-dark" />
            </div>
            <h2 className="font-syne font-bold text-[17px] text-brand-ink mb-2">Verified providers</h2>
            <p className="font-dm text-[14px] text-brand-muted leading-relaxed">
              Guides and agencies pass our review process before publishing. Prefer to lead tours yourself? Apply as a provider.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
