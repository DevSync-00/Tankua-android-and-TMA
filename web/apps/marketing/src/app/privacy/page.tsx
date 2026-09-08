import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Tankua",
  description: "Learn how Tankua collects, uses, shares, and protects information across its website, mobile apps, and Telegram Mini App.",
};

const sections = [
  {
    title: "1. Who this policy applies to",
    content: (
      <p>
        This policy applies when you use Tankua&apos;s website, mobile applications,
        Telegram Mini App, booking services, customer support, or other services
        that link to this page (together, the &quot;Services&quot;).
      </p>
    ),
  },
  {
    title: "2. Information we collect",
    content: (
      <>
        <p>Depending on how you use the Services, we may collect:</p>
        <ul>
          <li><strong>Account details:</strong> name, phone number, email address, profile photo, and account preferences.</li>
          <li><strong>Telegram details:</strong> Telegram user ID, username, display name, language, profile photo, and signed authentication data provided when you open our Mini App.</li>
          <li><strong>Booking details:</strong> destinations, dates, pickup points, passenger names and ages, booking status, tickets, and booking history.</li>
          <li><strong>Payment details:</strong> transaction identifiers, amounts, currency, and payment status. Payment card and mobile-money credentials are processed by our payment providers and are not stored by Tankua.</li>
          <li><strong>Location information:</strong> location you provide or permit us to access for pickup points, maps, nearby destinations, and navigation.</li>
          <li><strong>Support and feedback:</strong> messages, trip suggestions, complaints, reviews, and other communications.</li>
          <li><strong>Technical information:</strong> IP address, browser or device type, app version, language, timestamps, diagnostic logs, and security events.</li>
        </ul>
      </>
    ),
  },
  {
    title: "3. How we use information",
    content: (
      <ul>
        <li>Create and secure your account and authenticate Telegram sessions.</li>
        <li>Show destinations and trips, process bookings, and issue QR tickets.</li>
        <li>Share necessary booking details with the travel provider fulfilling your trip.</li>
        <li>Process payments, refunds, rewards, and promotions.</li>
        <li>Send booking, payment, departure, safety, and customer-support updates.</li>
        <li>Personalize and improve the Services and troubleshoot technical problems.</li>
        <li>Prevent fraud, abuse, unauthorized access, and other harmful activity.</li>
        <li>Meet legal, accounting, tax, and regulatory requirements.</li>
      </ul>
    ),
  },
  {
    title: "4. When we share information",
    content: (
      <>
        <p>We do not sell your personal information. We may share it with:</p>
        <ul>
          <li><strong>Travel providers</strong> when needed to operate and confirm your booked trip.</li>
          <li><strong>Payment processors</strong> to complete payments, refunds, and fraud checks.</li>
          <li><strong>Technology vendors</strong> that provide hosting, databases, maps, analytics, messaging, and customer support on our behalf.</li>
          <li><strong>Authorities or other parties</strong> when required by law, necessary to protect rights and safety, or involved in a business reorganization.</li>
        </ul>
        <p>These recipients receive only the information reasonably needed for their role.</p>
      </>
    ),
  },
  {
    title: "5. Telegram and third-party services",
    content: (
      <p>
        The Telegram Mini App runs inside Telegram. Telegram independently processes
        information under its own privacy policy. The Services may also link to maps,
        payment providers, travel providers, and other third parties. Their handling of
        information is governed by their own policies, not this policy.
      </p>
    ),
  },
  {
    title: "6. Data retention and security",
    content: (
      <>
        <p>
          We keep information only as long as needed to provide the Services, maintain
          business and financial records, resolve disputes, prevent fraud, and meet legal
          obligations. Retention periods vary by the type of information and applicable law.
        </p>
        <p>
          We use reasonable administrative, technical, and organizational safeguards.
          However, no online service can guarantee absolute security.
        </p>
      </>
    ),
  },
  {
    title: "7. Your choices and rights",
    content: (
      <>
        <p>Subject to applicable law, you may ask us to:</p>
        <ul>
          <li>Provide access to or a copy of your personal information.</li>
          <li>Correct inaccurate or incomplete information.</li>
          <li>Delete your account and associated personal information.</li>
          <li>Object to or restrict certain processing.</li>
          <li>Withdraw consent or opt out of promotional messages.</li>
        </ul>
        <p>
          You can edit profile information and request account deletion from the Tankua
          app. You may also contact us using the address below. We may retain limited
          records when required by law or necessary for security and dispute resolution.
        </p>
      </>
    ),
  },
  {
    title: "8. Children",
    content: (
      <p>
        Tankua is not intended for children to create independent accounts or make
        bookings without a parent or legal guardian. Passenger information for a minor
        must be provided by an authorized adult. Contact us if you believe a child has
        submitted information without appropriate permission.
      </p>
    ),
  },
  {
    title: "9. International processing",
    content: (
      <p>
        Our service providers may process information in countries other than the one
        where you live. Where required, we use appropriate safeguards for those transfers.
      </p>
    ),
  },
  {
    title: "10. Changes to this policy",
    content: (
      <p>
        We may update this policy as our Services or legal obligations change. We will
        post the revised policy here and update the effective date. We may provide an
        additional notice when a change materially affects your rights.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#FFF8EC] text-[#0A1A2F]">
      <header className="border-b border-[#0A1A2F]/10 bg-[#FFF8EC]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Tankua home">
            <Image src="/icon.jpg" width={36} height={36} alt="" className="rounded-lg object-cover" priority />
            <span className="text-lg font-extrabold tracking-tight">Tankua</span>
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors hover:bg-[#0A1A2F]/5">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to home</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      <section className="border-b border-[#0A1A2F]/10 bg-gradient-to-b from-[#FFE9AD] to-[#FFF8EC]">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#FFB800] shadow-lg shadow-[#FFB800]/20">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.2em] text-[#9B6900]">Trust and transparency</p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Privacy Policy</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#0A1A2F]/70">
            This policy explains what information Tankua handles, why we use it, and the choices available to you.
          </p>
          <p className="mt-5 text-sm font-medium text-[#0A1A2F]/55">Effective September 8, 2026</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-16">
        <aside className="h-fit rounded-2xl border border-[#0A1A2F]/10 bg-white/70 p-5 lg:sticky lg:top-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#9B6900]">At a glance</p>
          <p className="mt-3 text-sm leading-6 text-[#0A1A2F]/65">
            We use information to operate bookings and protect your account. We do not sell personal information.
          </p>
          <a href="mailto:support@tankua.et" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#8A5C00] hover:underline">
            <Mail className="h-4 w-4" /> support@tankua.et
          </a>
        </aside>

        <article className="min-w-0 rounded-3xl border border-[#0A1A2F]/10 bg-white p-6 shadow-[0_18px_60px_rgba(10,26,47,0.07)] sm:p-10">
          <div className="space-y-10 text-[15px] leading-7 text-[#0A1A2F]/75 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-[#0A1A2F] [&_li]:pl-1 [&_p+p]:mt-4 [&_strong]:font-bold [&_strong]:text-[#0A1A2F] [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
            <section>
              <h2>Introduction</h2>
              <p className="mt-3">
                Tankua (&quot;Tankua,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) provides a travel marketplace that helps people discover Ethiopian destinations and book trips with travel providers. We respect your privacy and aim to handle personal information responsibly and transparently.
              </p>
            </section>
            {sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                <div className="mt-3">{section.content}</div>
              </section>
            ))}
            <section className="rounded-2xl bg-[#FFF3D2] p-5 sm:p-6">
              <h2>11. Contact us</h2>
              <p className="mt-3">
                For privacy questions or requests, email us at{" "}
                <a className="font-bold text-[#805500] underline decoration-[#FFB800] decoration-2 underline-offset-4" href="mailto:support@tankua.et">
                  support@tankua.et
                </a>.
              </p>
            </section>
          </div>
        </article>
      </div>

      <footer className="bg-[#2A1F15] px-4 py-9 text-white sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-3">
            <Image src="/icon.jpg" width={32} height={32} alt="" className="rounded-lg object-cover" />
            <span className="font-bold">Tankua</span>
          </div>
          <div className="flex items-center gap-5 text-sm text-white/65">
            <Link href="/terms" className="hover:text-[#FFB800]">Terms</Link>
            <Link href="/contact" className="hover:text-[#FFB800]">Contact</Link>
          </div>
          <p className="text-sm text-white/50">© 2026 Tankua. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
