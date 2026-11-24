"use client";

import Link from "next/link";
import { 
  Smartphone,
  Search,
  Calendar,
  CreditCard,
  QrCode,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Send,
} from "lucide-react";
import { Badge, buttonVariants, Card } from "@tankua/ui";
import { TELEGRAM_MINI_APP_URL } from "@/lib/telegram";

const steps = [
  {
    number: "01",
    icon: <Search className="h-8 w-8" />,
    title: "Discover tours",
    description: "Browse tours across Ethiopia and compare departure dates, prices, and local operators.",
    features: ["Destinations across Ethiopia", "Tour details", "Departure dates", "Category filters"],
  },
  {
    number: "02",
    icon: <Calendar className="h-8 w-8" />,
    title: "Choose a departure",
    description: "Open the tour details. Select Book in Telegram when payments are open, or Reserve in Telegram to hold seats until the operator confirms the departure.",
    features: ["Tour operator", "Trip type", "Price per person", "Booking status"],
  },
  {
    number: "03",
    icon: <MapPin className="h-8 w-8" />,
    title: "Pick your seats and pickup point",
    description: "In Tankua on Telegram, choose how many seats you need and select from the pickup options for your departure. Pickup times are shown in East Africa Time.",
    features: ["Seat count", "Pickup options", "Pickup times", "Booking total"],
  },
  {
    number: "04",
    icon: <CreditCard className="h-8 w-8" />,
    title: "Complete your payment",
    description: "Pay through Chapa for an active trip. If you reserved seats without payment, return to My Trips in Telegram and complete payment once the operator confirms the trip.",
    features: ["Chapa checkout", "Options by currency", "Reservation status", "Payment status"],
  },
  {
    number: "05",
    icon: <QrCode className="h-8 w-8" />,
    title: "Get your ticket",
    description: "After payment is confirmed, open the Trips tab in Tankua on Telegram to view your QR ticket. Show it to the driver at pickup.",
    features: ["Digital QR ticket", "Departure details", "Pickup details", "Phone check-in"],
  },
];

const faqs = [
  {
    question: "How do I book a trip?",
    answer: <><Link href="/tours" className="font-medium underline">Browse tours</Link>, choose a departure, and select <strong>Book in Telegram</strong> or <strong>Reserve in Telegram</strong> on the tour page.</>,
  },
  {
    question: "What payment methods are accepted?",
    answer: "Tankua uses Chapa checkout in Telegram. The checkout shows the payment options for your booking currency.",
  },
  {
    question: "Can I cancel my booking?",
    answer: <><Link href="/contact" className="font-medium underline">Contact support</Link> for help with a cancellation. See the <Link href="/terms" className="font-medium underline">cancellation policy</Link> for refund terms.</>,
  },
  {
    question: "How do I find my pickup station?",
    answer: "Check the tour details for pickup options. After choosing a pickup point in Telegram, you can find it again in the Trips tab.",
  },
  {
    question: "What if my trip is cancelled?",
    answer: <>Check the Trips tab for your booking status. If you paid and need help with a refund, <Link href="/contact" className="font-medium underline">contact support</Link>.</>,
  },
];

export default function HowItWorksPage() {
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
              <Link href="/how-it-works" className="text-[#ffb800] font-medium">How It Works</Link>
              <Link href="/tours" className="text-[#181714]/70 hover:text-[#181714]">Tours</Link>
              <Link href="/providers" className="text-[#181714]/70 hover:text-[#181714]">For Providers</Link>
            </div>
            <a href={TELEGRAM_MINI_APP_URL} className={buttonVariants()}>Open in Telegram</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-[#f7f5f0] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4">Simple Process</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-[#181714] mb-6">
              How to book a tour <span className="text-[#ffb800]">with Tankua</span>
            </h1>
            <p className="text-lg text-[#181714]/70 mb-8">
              Find a departure on Tankua, then continue in Telegram to book or reserve your seats.
            </p>
            <Link href="/tours" className={buttonVariants({ size: "lg", className: "bg-[#ffb800] hover:bg-[#d99c00]" })}>
              Browse tours
              <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {steps.map((step, index) => (
            <div 
              key={step.number}
              className={`flex flex-col lg:flex-row items-center gap-12 mb-20 last:mb-0 ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl font-bold text-[#ffb800]/20">{step.number}</span>
                  <div className="w-14 h-14 rounded-2xl bg-[#ffb800]/10 flex items-center justify-center text-[#ffb800]">
                    {step.icon}
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-[#181714] mb-4">{step.title}</h2>
                <p className="text-lg text-[#181714]/70 mb-6">{step.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  {step.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-[#ffb800]" aria-hidden="true" />
                      <span className="text-sm text-[#181714]/70">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Illustration */}
              <div className="flex-1">
                <Card className="p-8 bg-gradient-to-br from-[#f7f5f0] to-white aspect-square flex items-center justify-center">
                  <div className="w-32 h-32 rounded-3xl bg-[#ffb800]/10 flex items-center justify-center text-[#ffb800]">
                    {step.icon}
                  </div>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-[#f7f5f0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4">FAQs</Badge>
            <h2 className="text-3xl font-bold text-[#181714]">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.question} className="p-6">
                <h3 className="text-lg font-bold text-[#181714] mb-2">{faq.question}</h3>
                <p className="text-[#181714]/70">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#181714]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#ffb800] flex items-center justify-center">
            <Smartphone className="h-10 w-10 text-white" aria-hidden="true" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Find your next departure
          </h2>
          <p className="text-lg text-white/70 mb-8">
            Compare Ethiopian tours or open Tankua in Telegram to see your trips.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/tours" className={buttonVariants({ size: "lg", className: "bg-[#ffb800] hover:bg-[#d99c00]" })}>
              Browse tours
              <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
            </Link>
            <a href={TELEGRAM_MINI_APP_URL} className={buttonVariants({ size: "lg", variant: "outline", className: "border-white/60 text-white" })}>
              <Send className="h-5 w-5 mr-2" aria-hidden="true" />
              Open in Telegram
            </a>
          </div>
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


