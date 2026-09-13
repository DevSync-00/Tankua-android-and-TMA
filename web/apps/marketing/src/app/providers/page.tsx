"use client";

import Image from "next/image";
import Link from "next/link";
import { 
  Users,
  TrendingUp,
  CreditCard,
  BarChart3,
  Shield,
  Smartphone,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button, Card, Badge } from "@tankua/ui";

const benefits = [
  {
    icon: <Users className="h-8 w-8" />,
    title: "Reach More Customers",
    description: "Access thousands of travelers looking for trusted tour providers. Our platform brings customers directly to you.",
  },
  {
    icon: <Smartphone className="h-8 w-8" />,
    title: "Easy Management",
    description: "Manage your trips, bookings, drivers, and earnings all from one intuitive dashboard.",
  },
  {
    icon: <CreditCard className="h-8 w-8" />,
    title: "Guaranteed Payments",
    description: "Get paid reliably with our secure payment system. Weekly payouts directly to your bank account.",
  },
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: "Growth Analytics",
    description: "Track your performance with detailed reports and insights to help grow your business.",
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Trust & Credibility",
    description: "Being on Tankua gives you instant credibility. We verify all providers for customer safety.",
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "Scale Your Business",
    description: "Whether you have one vehicle or a fleet, our platform scales with your business needs.",
  },
];

const features = [
  "Create and manage trip listings",
  "Accept online bookings",
  "Manage driver assignments",
  "Track earnings and payouts",
  "View customer reviews",
  "Access performance analytics",
  "Handle cancellations and refunds",
  "24/7 support access",
];

const testimonials = [
  {
    quote: "Tankua has transformed our business. We've seen a 300% increase in bookings since joining the platform.",
    author: "Abyssinia Tours",
    role: "Travel Provider since 2023",
  },
  {
    quote: "The provider dashboard is so easy to use. Managing our trips and drivers has never been simpler.",
    author: "Lalibela Adventure Tours",
    role: "Travel Provider since 2023",
  },
];

export default function ProvidersPage() {
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
              <Link href="/providers" className="text-[#ffb800] font-medium">For Providers</Link>
            </div>
            <Link href="https://provider.tankua.co">
              <Button>Provider Login</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-[#181714] to-[#1a2d4a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-[#ffb800]/20 text-[#ffb800]">For Travel Providers</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Grow Your Travel Business with 
                <span className="text-[#ffb800]"> Tankua</span>
              </h1>
              <p className="text-lg text-white/70 mb-8">
                Join Ethiopia's leading tour and travel platform. Reach thousands of 
                travelers, manage your operations efficiently, and scale your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="https://provider.tankua.co/register">
                  <Button size="lg" className="bg-[#ffb800] hover:bg-[#d99c00]">
                    Become a Provider
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="https://provider.tankua.co">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Provider Login
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <Card className="p-8 bg-white/10 backdrop-blur border-white/20">
                <div className="grid grid-cols-2 gap-4 text-center text-white">
                  <div className="p-4">
                    <p className="text-4xl font-bold text-[#ffb800]">50+</p>
                    <p className="text-sm text-white/70">Active Providers</p>
                  </div>
                  <div className="p-4">
                    <p className="text-4xl font-bold text-[#ffb800]">10K+</p>
                    <p className="text-sm text-white/70">Bookings Made</p>
                  </div>
                  <div className="p-4">
                    <p className="text-4xl font-bold text-[#ffb800]">95%</p>
                    <p className="text-sm text-white/70">Provider Satisfaction</p>
                  </div>
                  <div className="p-4">
                    <p className="text-4xl font-bold text-[#ffb800]">5%</p>
                    <p className="text-sm text-white/70">Service Fee</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4">Why Tankua</Badge>
            <h2 className="text-3xl font-bold text-[#181714]">Benefits of Partnering with Us</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} hoverable className="p-6">
                <div className="w-14 h-14 mb-4 rounded-2xl bg-[#ffb800]/10 flex items-center justify-center text-[#ffb800]">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-bold text-[#181714] mb-2">{benefit.title}</h3>
                <p className="text-[#181714]/70">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-20 bg-[#f7f5f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">Provider Portal</Badge>
              <h2 className="text-3xl font-bold text-[#181714] mb-6">
                Everything You Need to Run Your Business
              </h2>
              <p className="text-lg text-[#181714]/70 mb-8">
                Our provider portal gives you all the tools you need to manage 
                your travel business efficiently and professionally.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-[#ffb800] flex-shrink-0" />
                    <span className="text-sm text-[#181714]/70">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="p-8">
              <div className="aspect-video bg-gradient-to-br from-[#181714] to-[#1a2d4a] rounded-xl flex items-center justify-center">
                <BarChart3 className="h-20 w-20 text-[#ffb800]/50" />
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4">Getting Started</Badge>
            <h2 className="text-3xl font-bold text-[#181714]">How to Become a Provider</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Register", description: "Sign up and submit your business details" },
              { step: "2", title: "Verification", description: "We verify your documents and credentials" },
              { step: "3", title: "Setup", description: "Add your trips, vehicles, and drivers" },
              { step: "4", title: "Start Earning", description: "Accept bookings and grow your business" },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffb800] flex items-center justify-center text-white text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-[#181714] mb-2">{item.title}</h3>
                <p className="text-sm text-[#181714]/70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-[#f7f5f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl font-bold text-[#181714]">What Providers Say</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8">
                <p className="text-lg text-[#181714] mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-bold text-[#181714]">{testimonial.author}</p>
                  <p className="text-sm text-[#181714]/50">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#181714]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Grow Your Business?
          </h2>
          <p className="text-lg text-white/70 mb-8">
            Join Tankua today and start reaching thousands of travelers looking for trusted tour providers.
          </p>
          <Link href="https://provider.tankua.co/register">
            <Button size="lg" className="bg-[#ffb800] hover:bg-[#d99c00]">
              Apply to Become a Provider
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-white/50 mt-4">
            Only 5% service fee • Weekly payouts • 24/7 support
          </p>
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


