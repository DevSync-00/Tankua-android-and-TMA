"use client";

import Link from "next/link";
import { CheckCircle, Mail, Clock, ArrowRight } from "lucide-react";
import { Button, Card } from "@tankua/ui";

export default function RegistrationSuccessPage() {
  return (
    <div className="auth-surface flex min-h-screen items-center justify-center p-4">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%23D4A017' fill-opacity='0.5'/%3E%3C/svg%3E")`,
        backgroundSize: "60px 60px",
      }} />

      <div className="relative max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
          <CheckCircle className="h-12 w-12 text-white" />
        </div>

        <h1 className="mb-4 text-3xl font-bold text-stone-950">Registration Submitted!</h1>
        <p className="mb-8 text-lg text-stone-600">
          Thank you for registering your company with Tankua. Your application is now under review.
        </p>

        <Card className="bg-white p-6 mb-8">
          <h2 className="mb-4 font-semibold text-stone-950">What happens next?</h2>
          
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-stone-950">Check your email</p>
                <p className="text-sm text-muted-foreground">
                  We've sent a confirmation email with your application details.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-stone-950">Verification in progress</p>
                <p className="text-sm text-muted-foreground">
                  Our team will review your documents within 1-2 business days.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-stone-950">Get approved</p>
                <p className="text-sm text-muted-foreground">
                  Once approved, you'll receive login credentials to access the Provider Portal.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Link href="/login">
            <Button className="w-full" size="lg">
              Go to Login
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          <Link href="/">
            <Button variant="ghost" className="w-full text-stone-700 hover:bg-stone-100 hover:text-stone-950">
              Return to Homepage
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-sm text-stone-400">
          Questions? Contact us at{" "}
          <a href="mailto:support@tankua.et" className="text-[#D4A017] hover:underline">
            support@tankua.et
          </a>
        </p>
      </div>
    </div>
  );
}

