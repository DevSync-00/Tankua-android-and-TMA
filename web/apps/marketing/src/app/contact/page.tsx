"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Button, Card, Badge, Input } from "@tankua/ui";

const contactInfo = [
  {
    icon: <Mail className="h-6 w-6" />,
    title: "Email",
    value: "support@tankua.et",
    description: "We'll respond within 24 hours",
  },
  {
    icon: <Phone className="h-6 w-6" />,
    title: "Phone",
    value: "+251 911 123 456",
    description: "Mon-Fri, 8AM-6PM EAT",
  },
  {
    icon: <MapPin className="h-6 w-6" />,
    title: "Office",
    value: "Bole, Addis Ababa",
    description: "Ethiopia",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { submitContactForm } = await import("@/lib/queries");
      const result = await submitContactForm(formData);
      
      if (result.success) {
    setSubmitted(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setError("Failed to send message. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
      console.error("Contact form error:", err);
    } finally {
      setLoading(false);
    }
  };

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
              <Link href="/contact" className="text-[#ffb800] font-medium">Contact</Link>
            </div>
            <Button>Download App</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-[#f7f5f0] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4">Get In Touch</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-[#181714] mb-6">
              We'd Love to 
              <span className="text-[#ffb800]"> Hear From You</span>
            </h1>
            <p className="text-lg text-[#181714]/70">
              Have questions about Tankua? Want to become a provider? 
              We're here to help you plan your perfect tour.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {contactInfo.map((info, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#ffb800]/10 flex items-center justify-center text-[#ffb800]">
                  {info.icon}
                </div>
                <h3 className="text-lg font-bold text-[#181714] mb-1">{info.title}</h3>
                <p className="text-[#ffb800] font-medium mb-1">{info.value}</p>
                <p className="text-sm text-[#181714]/50">{info.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-[#181714] mb-2">Message Sent!</h2>
                <p className="text-[#181714]/70 mb-6">
                  Thank you for contacting us. We'll get back to you within 24 hours.
                </p>
                <Button onClick={() => setSubmitted(false)}>Send Another Message</Button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#ffb800]/10 flex items-center justify-center text-[#ffb800]">
                    <MessageSquare className="h-7 w-7" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#181714]">Send us a Message</h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#181714] mb-2">
                        Your Name
                      </label>
                      <Input
                        required
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#181714] mb-2">
                        Email Address
                      </label>
                      <Input
                        required
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#181714] mb-2">
                      Subject
                    </label>
                    <Input
                      required
                      placeholder="How can we help?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#181714] mb-2">
                      Message
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Tell us more about your inquiry..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#ffb800] focus:ring-2 focus:ring-[#ffb800]/20 outline-none transition-all resize-none"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full bg-[#ffb800] hover:bg-[#d99c00]"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </section>

      {/* FAQ Link */}
      <section className="py-12 bg-[#f7f5f0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Clock className="h-10 w-10 mx-auto mb-4 text-[#ffb800]" />
          <h2 className="text-2xl font-bold text-[#181714] mb-2">Looking for Quick Answers?</h2>
          <p className="text-[#181714]/70 mb-6">
            Check out our frequently asked questions for instant help.
          </p>
          <Link href="/how-it-works#faqs">
            <Button variant="outline">View FAQs</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#181714] py-12">
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


