"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@tankua/ui";
import { AuthError, AuthHeading, AuthPasswordField, AuthShell } from "@/components/auth-shell";

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
    <AuthShell footer={<p>New to Tankua? <Link href="/register" className="auth-link">Register your company <ArrowRight aria-hidden="true" size={16} /></Link></p>}>
      <AuthHeading title="Sign in to Tankua">
        Manage your trips, bookings and fleet in the provider portal.
      </AuthHeading>

      <form className="auth-form" onSubmit={handleLogin}>
        {error ? <AuthError>{error}</AuthError> : null}
        <div className="auth-field">
          <label htmlFor="provider-email">Work email</label>
          <input
            id="provider-email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <AuthPasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          visible={showPassword}
          onToggle={() => setShowPassword((visible) => !visible)}
          autoComplete="current-password"
        />
        <Link href="/forgot-password" className="auth-link auth-forgot">Forgot password?</Link>
        <Button type="submit" className="auth-submit" isLoading={isLoading}>
          Sign in <ArrowRight aria-hidden="true" size={18} />
        </Button>
      </form>
    </AuthShell>
  );
}
