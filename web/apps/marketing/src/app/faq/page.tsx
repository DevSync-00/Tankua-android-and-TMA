"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Badge, buttonVariants, Card } from "@tankua/ui";
import { TELEGRAM_MINI_APP_URL } from "@/lib/telegram";

const faqs = [
  {
    category: "Booking",
    questions: [
      {
        q: "How do I book a tour?",
        a: (
          <>
            <Link href="/tours" className="font-medium underline">Browse tours</Link> and choose a departure. Select <strong>Book in Telegram</strong> to choose your pickup and seats and continue to payment. If you see <strong>Reserve in Telegram</strong>, you can hold seats and pay from My Trips after the operator confirms the departure.
          </>
        ),
      },
      {
        q: "What payment methods do you accept?",
        a: "Tankua uses Chapa checkout in Telegram. The checkout shows the payment options for your booking currency.",
      },
      {
        q: "Can I cancel my booking?",
        a: (
          <>
            <Link href="/contact" className="font-medium underline">Contact support</Link> for help with a cancellation. See the <Link href="/terms" className="font-medium underline">cancellation policy</Link> for refund terms.
          </>
        ),
      },
      {
        q: "How do I get my ticket?",
        a: "After payment is confirmed, open the Trips tab in Tankua on Telegram to view your QR ticket. Show it on your phone at pickup.",
      },
    ],
  },
  {
    category: "Tours & Destinations",
    questions: [
      {
        q: "What types of tours do you offer?",
        a: "We offer group trips, private tours, and special holiday packages. Categories include adventure tours, cultural experiences, historical sites, nature & wildlife, and city tours.",
      },
      {
        q: "Are the tour providers verified?",
        a: "Yes! All providers on Tankua are verified and rated. We ensure they meet our quality standards for safety and service.",
      },
      {
        q: "What should I bring on a tour?",
        a: "Bring comfortable clothing, water, snacks, and any personal items. Specific requirements are listed on each tour's detail page.",
      },
      {
        q: "Do tours include meals?",
        a: "This varies by tour. Check the tour details page for information about meals, accommodations, and inclusions.",
      },
    ],
  },
  {
    category: "App & Account",
    questions: [
      {
        q: "How do I download the Tankua app?",
        a: <Link href="/download" className="font-medium underline">See the Tankua download options.</Link>,
      },
      {
        q: "Do I need to create an account?",
        a: "Yes, creating an account allows you to manage bookings, save favorites, and access your booking history.",
      },
      {
        q: "How do I sign in on Telegram?",
        a: <><a href={TELEGRAM_MINI_APP_URL} className="font-medium underline">Open Tankua in Telegram</a> to sign in with your Telegram account.</>,
      },
      {
        q: "Can I book without downloading the Tankua app?",
        a: <>Yes. <Link href="/tours" className="font-medium underline">Choose a tour on our website</Link> and continue in the Tankua Mini App inside Telegram.</>,
      },
    ],
  },
  {
    category: "For Providers",
    questions: [
      {
        q: "How do I become a provider?",
        a: "Visit our Providers page and click 'Register Your Company'. Complete the registration form and our team will review your application.",
      },
      {
        q: "What are the requirements?",
        a: "You need a registered travel business, valid licenses, insurance, and vehicles. Our team will guide you through the requirements.",
      },
      {
        q: "How do I get paid?",
        a: "We process weekly payouts directly to your bank account. Payment is secure and automatic after trips are completed.",
      },
      {
        q: "Can I manage my trips on the platform?",
        a: "Yes! The Provider Portal gives you full control over trips, bookings, drivers, vehicles, and earnings.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffb800] to-[#ffc83d] flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-xl font-bold text-[#181714]">Tankua</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/about" className="text-[#181714]/70 hover:text-[#181714]">About</Link>
              <Link href="/how-it-works" className="text-[#181714]/70 hover:text-[#181714]">How It Works</Link>
              <Link href="/tours" className="text-[#181714]/70 hover:text-[#181714]">Tours</Link>
              <Link href="/contact" className="text-[#181714]/70 hover:text-[#181714]">Contact</Link>
            </div>
            <a href={TELEGRAM_MINI_APP_URL} className={buttonVariants()}>Open in Telegram</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-[#f7f5f0] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4">Help Center</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-[#181714] mb-6">
              Frequently Asked
              <span className="text-[#ffb800]"> Questions</span>
            </h1>
            <p className="text-lg text-[#181714]/70">
              Find answers about booking tours in Telegram, getting tickets, and becoming a provider.
            </p>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {faqs.map((category, categoryIndex) => (
              <div key={category.category}>
                <h2 className="text-2xl font-bold text-[#181714] mb-4 flex items-center gap-2">
                  <HelpCircle className="h-6 w-6 text-[#ffb800]" />
                  {category.category}
                </h2>
                <div className="space-y-3">
                  {category.questions.map((faq, index) => {
                    const globalIndex = categoryIndex * 100 + index;
                    const isOpen = openIndex === globalIndex;
                    const answerId = `faq-answer-${globalIndex}`;
                    return (
                      <Card key={faq.q} className="overflow-hidden">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={answerId}
                          onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                          className="w-full p-6 flex items-center justify-between text-left hover:bg-[#f7f5f0] transition-colors"
                        >
                          <span className="font-semibold text-[#181714] pr-4">{faq.q}</span>
                          <ChevronDown
                            aria-hidden="true"
                            className={`h-5 w-5 text-[#ffb800] flex-shrink-0 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        <div id={answerId} hidden={!isOpen} className="px-6 pb-6 text-[#181714]/70">
                          {faq.a}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-20 bg-[#181714]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Still Have Questions?
          </h2>
          <p className="text-lg text-white/70 mb-8">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <Link href="/contact" className={buttonVariants({ size: "lg", className: "bg-[#ffb800] hover:bg-[#d99c00]" })}>
            Contact Support
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#181714] border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#ffb800] flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
              <span className="text-white font-bold">Tankua</span>
            </div>
            <p className="text-white/50 text-sm">
              © {new Date().getFullYear()} Tankua. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
