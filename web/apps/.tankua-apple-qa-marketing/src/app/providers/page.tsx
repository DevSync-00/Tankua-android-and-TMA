import { ArrowRight, CalendarDays, CircleDollarSign, ClipboardList, Star, Ticket, Truck } from "lucide-react";
import { FieldHero } from "@/components/FieldHero";
import { providerPortalUrl, providerRegisterUrl } from "@/lib/portalUrls";

const tools = [
  { icon: CalendarDays, title: "Trips and departures", detail: "Publish listings and manage your schedule." },
  { icon: Ticket, title: "Bookings and changes", detail: "Track bookings, cancellations, and refunds." },
  { icon: Truck, title: "Drivers and vehicles", detail: "Assign drivers and vehicles to your trips." },
  { icon: CircleDollarSign, title: "Earnings and payouts", detail: "See trip earnings and follow weekly bank payouts." },
  { icon: Star, title: "Reviews and reports", detail: "Read customer feedback and review your performance." },
  { icon: ClipboardList, title: "Provider support", detail: "Contact Tankua for help with your account." },
];

const steps = [
  { title: "Apply", detail: "Send your business information and supporting documents." },
  { title: "Get verified", detail: "Tankua reviews your application and credentials." },
  { title: "Set up your trips", detail: "Add your departures, vehicles, and drivers." },
  { title: "Take bookings", detail: "Publish your trips so travelers can find and book them." },
];

export default function ProvidersPage() {
  return (
    <main className="field-page">
      <FieldHero
        title="Tankua for tour operators"
        description="List your tours for travelers planning a trip in Ethiopia, then manage departures and bookings from your provider dashboard."
        image="/images/pexels-christian-alemu-127251395-31047251.jpg"
        imageAlt="Traditional buildings surrounded by green landscape in Ethiopia"
      >
        <div className="field-hero-actions">
          <a href={providerRegisterUrl} className="field-button field-button--light">Apply as a provider<ArrowRight size={18} aria-hidden="true" /></a>
          <a href={providerPortalUrl} className="field-link field-link--light">Sign in<ArrowRight size={18} aria-hidden="true" /></a>
        </div>
      </FieldHero>

      <section className="field-wrap field-provider-tools" aria-labelledby="provider-tools-heading">
        <div>
          <h2 id="provider-tools-heading" className="field-display">Tools for running your tours</h2>
          <p>Keep track of what needs your attention before and after every trip.</p>
        </div>
        <dl>
          {tools.map(({ icon: Icon, title, detail }) => (
            <div key={title}>
              <Icon size={23} aria-hidden="true" />
              <div><dt>{title}</dt><dd>{detail}</dd></div>
            </div>
          ))}
        </dl>
      </section>

      <section className="field-partner-process" aria-labelledby="provider-steps-heading">
        <div className="field-wrap">
          <h2 id="provider-steps-heading" className="field-display">How to list your tours</h2>
          <ol>
            {steps.map(({ title, detail }, index) => (
              <li key={title}>
                <span aria-hidden="true">{index + 1}</span>
                <h3>{title}</h3>
                <p>{detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="field-band">
        <div className="field-wrap field-band-inner">
          <div>
            <h2 className="field-display">List your tours on Tankua</h2>
            <p>5% service fee, weekly payouts, and provider support.</p>
          </div>
          <a href={providerRegisterUrl} className="field-button field-button--light">Apply as a provider<ArrowRight size={18} aria-hidden="true" /></a>
        </div>
      </section>
    </main>
  );
}
