"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Building2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { Button, Card } from "@tankua/ui";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Import supabase client
      const { supabase } = await import("@/lib/supabase");
      
      // Check if email exists in provider_users table
      const { data: providerUser } = await supabase
        .from('provider_users')
        .select('email')
        .eq('email', email)
        .single();

      if (!providerUser) {
        setError("No provider account found with this email address.");
        setIsLoading(false);
        return;
      }

      // Send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        // Check if error is because auth user doesn't exist
        if (resetError.message?.includes('User not found') || resetError.message?.includes('not found')) {
          setError("Your provider account exists, but your authentication account hasn't been created yet. Please contact support to set up your login credentials. This usually happens if you registered before the authentication system was fully configured.");
        } else {
          setError(resetError.message || "Failed to send reset email. Please try again.");
        }
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-surface flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%23D4A017' fill-opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }} />

        <div className="relative">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FFB800] flex items-center justify-center shadow-lg overflow-hidden">
              <Image src="/favicon.png" alt="Tankua" width={34} height={34} className="object-contain" priority />
            </div>
            <div>
              <span className="text-2xl font-bold text-stone-950">Tankua</span>
              <span className="block text-sm text-stone-500">Provider Portal</span>
            </div>
          </Link>
        </div>

        <div className="relative space-y-8">
          <h1 className="text-4xl font-bold leading-tight text-stone-950">
            Reset Your Password
          </h1>
          <p className="text-xl text-stone-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="relative text-sm text-stone-400">
          © 2024 Tankua. All rights reserved.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FFB800] flex items-center justify-center shadow-lg mb-4 overflow-hidden">
              <Image src="/favicon.png" alt="Tankua" width={48} height={48} className="object-contain" priority />
            </div>
            <h1 className="text-2xl font-bold text-stone-950">Provider Portal</h1>
          </div>

          <Card className="bg-white p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-stone-950">Forgot Password?</h2>
              <p className="text-muted-foreground mt-2">
                {success 
                  ? "Check your email for reset instructions"
                  : "Enter your email to receive a password reset link"
                }
              </p>
            </div>

            {success ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 p-6 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                  <div className="text-center">
                    <p className="text-green-800 font-semibold mb-2">Email Sent!</p>
                    <p className="text-sm text-green-700">
                      We've sent a password reset link to <strong>{email}</strong>
                    </p>
                    <p className="text-sm text-green-600 mt-2">
                      Please check your inbox and click the link to reset your password.
                    </p>
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the email? Check your spam folder or try again.
                  </p>
                  <Button
                    onClick={() => {
                      setSuccess(false);
                      setEmail("");
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Send Another Email
                  </Button>
                  <Link href="/login" className="block">
                    <Button variant="ghost" className="w-full">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full h-12 pl-12 pr-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter the email address associated with your provider account
                  </p>
                </div>

                <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                  <Building2 className="h-5 w-5 mr-2" />
                  Send Reset Link
                </Button>

                <div className="text-center">
                  <Link href="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
