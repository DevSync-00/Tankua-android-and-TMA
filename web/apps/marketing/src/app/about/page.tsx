"use client";

import Image from "next/image";
import Link from "next/link";
import { 
  Users, 
  MapPin, 
  Shield, 
  Heart,
  ChevronRight,
  Award,
  Clock,
  Globe,
} from "lucide-react";
import { Button, Card, Badge } from "@tankua/ui";

const team = [
  {
    name: "Abebe Tadesse",
    role: "Founder & CEO",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    bio: "Ethiopian tech entrepreneur with a passion for cultural preservation and tourism innovation.",
  },
  {
    name: "Sara Hailu",
    role: "Head of Operations",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    bio: "Former tourism executive with 10+ years of experience in Ethiopian travel industry.",
  },
  {
    name: "Yohannes Bekele",
    role: "Head of Technology",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    bio: "Software engineer passionate about building technology solutions for Ethiopian businesses.",
  },
];

const values = [
  {
    icon: <Heart className="h-8 w-8" />,
    title: "Authentic Experiences",
    description: "We believe in facilitating meaningful travel experiences that connect people with Ethiopia's rich culture and natural beauty.",
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Trust & Safety",
    description: "Every provider on our platform is verified to ensure safe and reliable travel experiences.",
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: "Community First",
    description: "We support local communities by partnering with local travel providers and guides.",
  },
  {
    icon: <Globe className="h-8 w-8" />,
    title: "Cultural Preservation",
    description: "We're committed to promoting and preserving Ethiopia's rich cultural heritage and natural wonders.",
  },
];

const milestones = [
  { year: "2023", title: "Founded in Addis Ababa", description: "Started with a vision to digitize tour and travel booking" },
  { year: "2023", title: "First 10 Providers", description: "Partnered with trusted travel companies" },
  { year: "2024", title: "Mobile App Launch", description: "Launched on iOS and Android" },
  { year: "2024", title: "15,000+ Travelers", description: "Helped thousands explore amazing destinations" },
];

export default function AboutPage() {
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
              <Link href="/about" className="text-[#ffb800] font-medium">About</Link>
              <Link href="/how-it-works" className="text-[#181714]/70 hover:text-[#181714]">How It Works</Link>
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
            <Badge className="mb-4">Our Story</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-[#181714] mb-6">
              Connecting Travelers with 
              <span className="text-[#ffb800]"> Amazing Experiences</span>
            </h1>
            <p className="text-lg text-[#181714]/70 mb-8">
              Tankua was founded with a simple mission: to make Ethiopia's incredible destinations 
              and tour experiences accessible to everyone through technology while supporting local communities.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <Card className="p-8 border-l-4 border-l-[#ffb800]">
              <h2 className="text-2xl font-bold text-[#181714] mb-4">Our Mission</h2>
              <p className="text-[#181714]/70 leading-relaxed">
                To democratize access to Ethiopia's amazing destinations by providing a seamless, 
                trustworthy platform that connects travelers with verified tour providers, 
                ensuring safe, affordable, and unforgettable travel experiences.
              </p>
            </Card>
            <Card className="p-8 border-l-4 border-l-[#181714]">
              <h2 className="text-2xl font-bold text-[#181714] mb-4">Our Vision</h2>
              <p className="text-[#181714]/70 leading-relaxed">
                To become Ethiopia's leading tour and travel platform, promoting tourism 
                while empowering local businesses and creating economic opportunities 
                for communities across the country.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-[#f7f5f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4">Our Values</Badge>
            <h2 className="text-3xl font-bold text-[#181714]">What Drives Us</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#ffb800]/10 flex items-center justify-center text-[#ffb800]">
                  {value.icon}
                </div>
                <h3 className="text-lg font-bold text-[#181714] mb-2">{value.title}</h3>
                <p className="text-sm text-[#181714]/70">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4">Our Journey</Badge>
            <h2 className="text-3xl font-bold text-[#181714]">Key Milestones</h2>
          </div>
          <div className="max-w-3xl mx-auto">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex gap-6 mb-8 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#ffb800] flex items-center justify-center text-white font-bold">
                    <Clock className="h-5 w-5" />
                  </div>
                  {index < milestones.length - 1 && (
                    <div className="w-0.5 h-16 bg-[#ffb800]/20" />
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <span className="text-sm font-semibold text-[#ffb800]">{milestone.year}</span>
                  <h3 className="text-lg font-bold text-[#181714] mt-1">{milestone.title}</h3>
                  <p className="text-[#181714]/70 mt-1">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-[#f7f5f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4">Our Team</Badge>
            <h2 className="text-3xl font-bold text-[#181714]">Meet the People Behind Tankua</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-bold text-[#181714]">{member.name}</h3>
                <p className="text-sm text-[#ffb800] font-medium mb-3">{member.role}</p>
                <p className="text-sm text-[#181714]/70">{member.bio}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#181714]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Join Our Journey
          </h2>
          <p className="text-lg text-white/70 mb-8">
            Whether you're a traveler seeking amazing experiences or a tour provider 
            looking to reach more customers, we'd love to have you on board.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-[#ffb800] hover:bg-[#d99c00]">
              Download the App
            </Button>
            <Link href="/providers">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Become a Provider
              </Button>
            </Link>
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


