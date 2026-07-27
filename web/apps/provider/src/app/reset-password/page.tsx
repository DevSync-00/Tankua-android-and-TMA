"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Building2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { Button, Card } from "@tankua/ui";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if we have a valid reset token in the URL
    const checkToken = async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (accessToken && type === 'recovery') {
          // Token is present, verify it's valid by trying to get the session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setIsValidToken(true);
          } else {
            // Try to set the session with the token
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: hashParams.get('refresh_token') || '',
            });
            setIsValidToken(!sessionError);
          }
        } else {
          setIsValidToken(false);
        }
      } catch (err) {
        setIsValidToken(false);
      }
    };

    checkToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { supabase } = await import("@/lib/supabase");

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message || "Failed to reset password. The link may have expired.");
        return;
      }

      // Check if user is a provider
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { data: providerUser } = await supabase
          .from('provider_users')
          .select('*, provider:providers(*)')
          .eq('email', user.email)
          .single();

        if (!providerUser) {
          setError("Access denied. Provider account required.");
          await supabase.auth.signOut();
          return;
        }
      }

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0d2341] to-[#0A1A2F] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0d2341] to-[#0A1A2F] flex items-center justify-center p-6">
        <Card className="bg-white p-8 max-w-md w-full">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-[#0A1A2F]">Invalid or Expired Link</h2>
            <p className="text-muted-foreground">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <div className="space-y-2 pt-4">
              <Link href="/forgot-password">
                <Button className="w-full">Request New Reset Link</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0d2341] to-[#0A1A2F] flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%23D4A017' fill-opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }} />

        <div className="relative">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#F4C430] flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">T</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">Tankua</span>
              <span className="block text-sm text-white/50">Provider Portal</span>
            </div>
          </Link>
        </div>

        <div className="relative space-y-8">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Set New Password
          </h1>
          <p className="text-xl text-white/70">
            Choose a strong password to secure your provider account.
          </p>
        </div>

        <div className="relative text-white/40 text-sm">
          © 2024 Tankua. All rights reserved.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#D4A017] to-[#F4C430] flex items-center justify-center shadow-lg mb-4">
              <span className="text-white font-bold text-3xl">T</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Provider Portal</h1>
          </div>

          <Card className="bg-white p-8">
            {success ? (
              <div className="text-center space-y-6">
                <div className="flex flex-col items-center gap-4 p-6 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                  <div>
                    <p className="text-green-800 font-semibold mb-2">Password Reset Successful!</p>
                    <p className="text-sm text-green-700">
                      Your password has been updated. Redirecting to login...
                    </p>
                  </div>
                </div>
                <Link href="/login">
                  <Button className="w-full">
                    Go to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-[#0A1A2F]">Reset Password</h2>
                  <p className="text-muted-foreground mt-2">Enter your new password below</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
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
                    <p className="text-xs text-muted-foreground mt-2">
                      Must be at least 8 characters long
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full h-12 pl-12 pr-12 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                    <Building2 className="h-5 w-5 mr-2" />
                    Reset Password
                  </Button>

                  <div className="text-center">
                    <Link href="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                      <ArrowLeft className="h-4 w-4" />
                      Back to Login
                    </Link>
                  </div>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
