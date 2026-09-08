"use client";

import { useState } from "react";
import {
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  ChevronRight,
  Send,
  ExternalLink,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@tankua/ui";

const faqs = [
  { question: "How do I create a new trip?", answer: "Go to 'My Trips' and click 'Create Trip'. Fill in the destination, dates, pricing, and capacity details." },
  { question: "When do I receive payouts?", answer: "Payouts are processed weekly on Fridays. The funds are transferred to your registered bank account within 1-2 business days." },
  { question: "How can I add a new driver?", answer: "Navigate to 'Drivers' section and click 'Add Driver'. You'll need their name, phone number, and license details." },
  { question: "What's the commission rate?", answer: "Tankua charges a 5% service fee on each booking. This is automatically deducted from your earnings." },
  { question: "How do I handle a cancellation?", answer: "Cancellations are handled through the 'Bookings' section. Click on the booking and select 'Cancel'. Refunds are processed automatically based on the cancellation policy." },
];

const recentTickets = [
  { id: "TKT-001", subject: "Payout delay inquiry", status: "resolved", date: "Jan 14, 2024" },
  { id: "TKT-002", subject: "Trip scheduling help", status: "in_progress", date: "Jan 15, 2024" },
];

export default function SupportPage() {
  const [showContact, setShowContact] = useState(false);

  return (
    <div className="min-h-screen">
      <Header
        title="Support"
        subtitle="Get help with your account"
      />

      <div className="portal-content">
        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-6">
          <Card className="p-6 hover:border-primary transition-colors cursor-pointer" onClick={() => setShowContact(true)}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Contact Support</p>
                <p className="text-sm text-muted-foreground">Send us a message</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 hover:border-primary transition-colors cursor-pointer">
            <a href="tel:+251911234567" className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Phone className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold">Call Us</p>
                <p className="text-sm text-muted-foreground">+251 911 234 567</p>
              </div>
            </a>
          </Card>
          <Card className="p-6 hover:border-primary transition-colors cursor-pointer">
            <a href="mailto:provider-support@tankua.et" className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold">Email</p>
                <p className="text-sm text-muted-foreground">provider-support@tankua.et</p>
              </div>
            </a>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* FAQs */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqs.map((faq, index) => (
                <details key={index} className="group">
                  <summary className="flex items-center justify-between p-4 bg-muted/30 rounded-xl cursor-pointer list-none">
                    <span className="font-medium">{faq.question}</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="p-4 text-muted-foreground">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </CardContent>
          </Card>

          {/* Recent Tickets */}
          <Card>
            <CardHeader>
              <CardTitle>Your Tickets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No support tickets</p>
                </div>
              ) : (
                recentTickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm">{ticket.subject}</p>
                      <Badge variant={ticket.status === "resolved" ? "success" : "warning"}>
                        {ticket.status === "resolved" ? "Resolved" : "In Progress"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{ticket.id}</span>
                      <span>{ticket.date}</span>
                    </div>
                  </div>
                ))
              )}
              <Button variant="outline" className="w-full mt-4" onClick={() => setShowContact(true)}>
                Open New Ticket
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Helpful Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <a href="#" className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Provider Guide</p>
                  <p className="text-xs text-muted-foreground">Getting started tutorial</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
              </a>
              <a href="#" className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Pricing Policy</p>
                  <p className="text-xs text-muted-foreground">Commission & payouts</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
              </a>
              <a href="#" className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Terms of Service</p>
                  <p className="text-xs text-muted-foreground">Provider agreement</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Contact Modal */}
        {showContact && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg p-6">
              <h2 className="text-xl font-bold mb-4">Contact Support</h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <input
                    type="text"
                    placeholder="Brief description of your issue"
                    className="w-full px-4 py-2 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    rows={4}
                    placeholder="Describe your issue in detail..."
                    className="w-full px-4 py-2 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowContact(false)}>Cancel</Button>
                  <Button type="submit" leftIcon={<Send className="h-4 w-4" />}>Send Message</Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

