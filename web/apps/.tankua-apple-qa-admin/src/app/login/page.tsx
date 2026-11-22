"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Shield, AlertCircle } from "lucide-react";
import { Button, Input, Card } from "@tankua/ui";

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
      
      // Attempt to sign in
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || "Invalid credentials. Please try again.");
        return;
      }

      if (data?.user) {
        // Check if user is admin
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', email)
          .single();

        if (!adminUser) {
          setError("Access denied. Admin account required.");
          await supabase.auth.signOut();
          return;
        }

        // Store admin session
        localStorage.setItem('admin_user', JSON.stringify(adminUser));
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-surface flex min-h-screen items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%23D4A017' fill-opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }} />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#D4A017]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#D4A017]/5 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FFB800] flex items-center justify-center shadow-lg shadow-[#D4A017]/30 mb-4 overflow-hidden">
            <Image src="/favicon.png" alt="Tankua" width={48} height={48} className="object-contain" priority />
          </div>
          <h1 className="text-2xl font-bold text-stone-950">Admin workspace</h1>
          <p className="mt-2 text-stone-600">Sign in to manage the Tankua platform</p>
        </div>

        <Card className="border border-stone-200 bg-white p-8 shadow-xl shadow-stone-200/50">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-xl border border-stone-200 bg-stone-50 pl-12 pr-4 text-stone-950 placeholder:text-stone-400 transition-all focus:border-[#D4A017] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/20"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border border-stone-200 bg-stone-50 pl-12 pr-12 text-stone-950 placeholder:text-stone-400 transition-all focus:border-[#D4A017] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors hover:text-stone-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/10 text-[#D4A017] focus:ring-[#D4A017]/20" />
                <span className="text-sm text-stone-600">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-[#D4A017] hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              <Shield className="h-5 w-5 mr-2" />
              Sign In to Admin
            </Button>
          </form>

          <div className="mt-6 border-t border-stone-200 pt-6">
            <p className="text-center text-sm text-stone-400">
              Protected admin area. Unauthorized access is prohibited.
            </p>
          </div>
        </Card>

        <p className="mt-8 text-center text-sm text-stone-500">
          Need help? Contact{" "}
          <a href="mailto:support@tankua.et" className="text-[#D4A017] hover:underline">
            support@tankua.et
          </a>
        </p>
      </div>
    </div>
  );
}

