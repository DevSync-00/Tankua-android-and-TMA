import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { providerPortalUrl, providerRegisterUrl } from "@/lib/portalUrls";

export default function ProviderPortalPage() {
  return (
    <main className="field-page field-portal">
      <div className="field-portal-content">
        <Link href="/" className="field-link field-portal-back"><ArrowLeft size={17} aria-hidden="true" />Tankua home</Link>
        <section aria-labelledby="provider-portal-heading">
          <h1 id="provider-portal-heading" className="field-display">Provider portal</h1>
          <p className="field-portal-intro">Manage departures, bookings, drivers, vehicles, and payouts for your tours in Ethiopia.</p>
          <div className="field-portal-action">
            <h2>Already on Tankua?</h2>
            <p>Go to your dashboard to manage your trips.</p>
            <a href={providerPortalUrl} className="field-button">Sign in to the portal<ArrowRight size={18} aria-hidden="true" /></a>
          </div>
          <div className="field-portal-action">
            <h2>New to Tankua?</h2>
            <p>Apply to list your tours and accept bookings.</p>
            <a href={providerRegisterUrl} className="field-link">Apply as a provider<ArrowRight size={18} aria-hidden="true" /></a>
          </div>
        </section>
      </div>
      <div className="field-portal-photo">
        <Image src="/siemen.jpg" alt="The Simien Mountains in Ethiopia" fill priority sizes="(max-width: 767px) 100vw, 46vw" />
      </div>
    </main>
  );
}
