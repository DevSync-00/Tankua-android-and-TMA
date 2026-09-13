"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Button, Card, Badge } from "@tankua/ui";

const faqs = [
  {
    category: "Booking",
    questions: [
      {
        q: "How do I book a tour?",
        a: "Booking is easy! Browse our tours, select your preferred date and trip type, choose a pickup point, and complete payment. You'll receive a QR code ticket instantly.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept Chapa, Telebirr, and other popular Ethiopian payment methods. All payments are secure and processed instantly.",
      },
      {
        q: "Can I cancel my booking?",
        a: "Yes, you can cancel your booking up to 24 hours before departure. Refunds are processed according to our cancellation policy.",
      },
      {
        q: "How do I get my ticket?",
        a: "After payment, you'll receive a digital QR code ticket in the app. No printing needed - just show it on your phone at pickup.",
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
        a: "Download from the App Store (iOS) or Google Play Store (Android). Links are available on our website homepage.",
      },
      {
        q: "Do I need to create an account?",
        a: "Yes, creating an account allows you to manage bookings, save favorites, and access your booking history.",
      },
      {
        q: "How do I reset my password?",
        a: "Use the 'Forgot Password' link on the login page. You'll receive reset instructions via SMS or email.",
      },
      {
        q: "Can I book without the app?",
        a: "Currently, booking requires the mobile app. However, you can browse tours and destinations on our website.",
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
            <Link href="/download">
              <Button>Download App</Button>
            </Link>
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
              Find answers to common questions about booking tours, using the app, and becoming a provider.
            </p>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h2 className="text-2xl font-bold text-[#181714] mb-4 flex items-center gap-2">
                  <HelpCircle className="h-6 w-6 text-[#ffb800]" />
                  {category.category}
                </h2>
                <div className="space-y-3">
                  {category.questions.map((faq, index) => {
                    const globalIndex = categoryIndex * 100 + index;
                    const isOpen = openIndex === globalIndex;
                    return (
                      <Card key={index} className="overflow-hidden">
                        <button
                          onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                          className="w-full p-6 flex items-center justify-between text-left hover:bg-[#f7f5f0] transition-colors"
                        >
                          <span className="font-semibold text-[#181714] pr-4">{faq.q}</span>
                          <ChevronDown
                            className={`h-5 w-5 text-[#ffb800] flex-shrink-0 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-6 text-[#181714]/70">
                            {faq.a}
                          </div>
                        )}
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
          <Link href="/contact">
            <Button size="lg" className="bg-[#ffb800] hover:bg-[#d99c00]">
              Contact Support
            </Button>
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
