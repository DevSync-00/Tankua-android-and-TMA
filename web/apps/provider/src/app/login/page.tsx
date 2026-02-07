"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Building2, AlertCircle, ArrowRight } from "lucide-react";
import { Button, Card } from "@tankua/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Import supabase client
      const { supabase } = await import("@/lib/supabase");
      
      const emailLower = email.trim().toLowerCase();
      
      if (!emailLower || !password) {
        setError("Please enter both email and password.");
        setIsLoading(false);
        return;
      }
      
      // Check if provider exists first
      const { data: providerCheck } = await supabase
        .from('providers')
        .select('id, email, status')
        .eq('email', emailLower)
        .maybeSingle();

      // Attempt to sign in
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: emailLower,
        password,
      });

      if (authError) {
        console.error('Auth error details:', {
          message: authError.message,
          status: authError.status,
          name: authError.name,
          fullError: authError
        });
        
        // Provide more helpful error messages based on error type
        if (authError.message?.includes('Email not confirmed') || authError.message?.includes('email_not_confirmed')) {
          setError("Please check your email and confirm your account before logging in. Check your inbox (and spam folder) for a confirmation link.");
        } else if (authError.message?.includes('Invalid login credentials') || authError.message?.includes('invalid_credentials') || authError.status === 400) {
          // Check if provider exists - if so, auth user might not exist or password is wrong
          if (providerCheck) {
            // Check if provider_user exists (created by trigger when approved)
            const { data: providerUserCheck } = await supabase
              .from('provider_users')
              .select('id')
              .eq('email', emailLower)
              .maybeSingle();

            if (providerCheck.status === 'inactive') {
              setError("Your provider account is pending approval. Please wait for admin approval before logging in. Once approved, you'll be able to log in.");
            } else if (providerUserCheck) {
              // Provider is active and provider_user exists, but auth login failed
              // This means: auth user doesn't exist OR wrong password OR email not confirmed
              setError("Authentication account not set up or password incorrect. Since your provider account is approved, please use 'Forgot Password' to set up your login credentials. If that doesn't work, contact support - your authentication account may need to be created manually.");
            } else {
              // Provider is active but provider_user doesn't exist - trigger might have failed
              setError("Your provider account is approved, but login setup is incomplete. Please contact support to complete your account setup.");
            }
          } else {
            setError("No provider account found with this email. Please register first or check your email address.");
          }
        } else {
          setError(authError.message || `Login failed: ${authError.status || 'Unknown error'}. Please try again or contact support.`);
        }
        return;
      }

      if (data?.user) {
        // Check if user is a provider
        const { data: providerUser } = await supabase
          .from('provider_users')
          .select('*, provider:providers(*)')
          .eq('email', emailLower)
          .single();
      
        if (!providerUser) {
          setError("Access denied. Provider account required. Your account may not be fully set up. Please contact support.");
          await supabase.auth.signOut();
          return;
        }

        // Verify provider is active
        if (providerUser.provider?.status !== 'active') {
          setError("Your provider account is pending approval. Please wait for admin approval before logging in.");
          await supabase.auth.signOut();
          return;
        }

        // Store provider session
        localStorage.setItem('provider_user', JSON.stringify(providerUser));
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0d2341] to-[#0A1A2F] flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%23FFB800' fill-opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }} />

        <div className="relative">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FFB800] flex items-center justify-center shadow-lg overflow-hidden">
              <Image src="/favicon.png" alt="Tankua" width={32} height={32} className="object-contain" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white">Tankua</span>
              <span className="block text-sm text-white/50">Provider Portal</span>
            </div>
          </Link>
        </div>

        <div className="relative space-y-8">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Grow Your Travel Business with{" "}
            <span className="text-[#FFB800]">Tankua</span>
          </h1>
          <p className="text-xl text-white/70">
            Join Ethiopia's fastest-growing pilgrimage platform and reach thousands of travelers.
          </p>

          <div className="space-y-4">
            {[
              "Access to 10,000+ active users",
              "Easy booking management",
              "Fast and secure payouts",
              "Marketing support",
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 text-white/80">
                <div className="w-5 h-5 rounded-full bg-[#FFB800] flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-white/40 text-sm">
          © 2024 Tankua. All rights reserved.
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FFB800] flex items-center justify-center shadow-lg mb-4 overflow-hidden">
              <Image src="/favicon.png" alt="Tankua" width={40} height={40} className="object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-white">Provider Portal</h1>
          </div>

          <Card className="bg-white p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#0A1A2F]">Welcome Back</h2>
              <p className="text-muted-foreground mt-2">Sign in to manage your business</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
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
                      className="w-full h-12 pl-12 pr-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 pl-12 pr-12 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20" />
                  <span className="text-sm text-muted-foreground">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                <Building2 className="h-5 w-5 mr-2" />
                Sign In
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary font-semibold hover:underline">
                  Register your company
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

