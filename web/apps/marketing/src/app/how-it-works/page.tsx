"use client";

import Image from "next/image";
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
  Download,
} from "lucide-react";
import { Button, Card, Badge } from "@tankua/ui";

const steps = [
  {
    number: "01",
    icon: <Search className="h-8 w-8" />,
    title: "Discover Tours",
    description: "Browse through hundreds of amazing tours across Ethiopia. View photos, read descriptions, and see available trip options by category.",
    features: ["250+ tour destinations", "Detailed descriptions", "Photo galleries", "Category filters"],
  },
  {
    number: "02",
    icon: <Calendar className="h-8 w-8" />,
    title: "Choose Your Trip",
    description: "Select your preferred trip type, date, and travel provider. Choose from group trips, private tours, or special holiday packages.",
    features: ["Group & private trips", "Flexible dates", "Multiple providers", "Price comparison"],
  },
  {
    number: "03",
    icon: <MapPin className="h-8 w-8" />,
    title: "Select Pickup Point",
    description: "Choose a convenient pickup station near you. View pickup times and any additional costs for each location.",
    features: ["City-wide stations", "Clear pickup times", "Easy navigation", "No hidden fees"],
  },
  {
    number: "04",
    icon: <CreditCard className="h-8 w-8" />,
    title: "Secure Payment",
    description: "Pay securely using your preferred method. We support Chapa, Telebirr, and other popular Ethiopian payment options.",
    features: ["Multiple payment options", "Secure transactions", "Instant confirmation", "Digital receipt"],
  },
  {
    number: "05",
    icon: <QrCode className="h-8 w-8" />,
    title: "Get Your Ticket",
    description: "Receive your digital QR ticket instantly. Simply show it to the driver on the day of your trip. No printing needed!",
    features: ["Digital QR ticket", "Trip details", "Driver contact", "Easy check-in"],
  },
];

const faqs = [
  {
    question: "How do I book a trip?",
    answer: "Simply download the Tankua app, browse tours by category, select your trip, choose a pickup station, and pay securely. You'll receive your digital ticket instantly.",
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept Chapa, Telebirr, CBE Birr, and Amole. More payment options are being added regularly.",
  },
  {
    question: "Can I cancel my booking?",
    answer: "Yes! Full refund if cancelled 48+ hours before the trip, 50% refund for 24-48 hours, and no refund within 24 hours.",
  },
  {
    question: "How do I find my pickup station?",
    answer: "The app shows all pickup stations on a map. You can filter by distance and see the exact pickup time for each location.",
  },
  {
    question: "What if my trip is cancelled?",
    answer: "If a trip is cancelled by the provider, you'll receive a full refund automatically. We'll also notify you immediately and help you book an alternative.",
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
            <Button>Download App</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-[#f7f5f0] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4">Simple Process</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-[#181714] mb-6">
              Booking Your Perfect Tour is 
              <span className="text-[#ffb800]"> Easy</span>
            </h1>
            <p className="text-lg text-[#181714]/70 mb-8">
              From discovering amazing destinations to receiving your digital ticket, 
              we've made the entire process seamless and straightforward.
            </p>
            <Button size="lg" className="bg-[#ffb800] hover:bg-[#d99c00]">
              <Download className="h-5 w-5 mr-2" />
              Get Started - Download App
            </Button>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {steps.map((step, index) => (
            <div 
              key={index} 
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
                  {step.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-[#ffb800]" />
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
            {faqs.map((faq, index) => (
              <Card key={index} className="p-6">
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
            <Smartphone className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-white/70 mb-8">
            Download Tankua today and book your first tour to one of Ethiopia's amazing destinations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-[#ffb800] hover:bg-[#d99c00]">
              <Download className="h-5 w-5 mr-2" />
              Download for iOS
            </Button>
            <Button size="lg" className="bg-[#ffb800] hover:bg-[#d99c00]">
              <Download className="h-5 w-5 mr-2" />
              Download for Android
            </Button>
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


