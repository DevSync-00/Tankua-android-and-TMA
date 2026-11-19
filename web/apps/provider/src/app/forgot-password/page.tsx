"use client";

import { useState } from "react";
import { ArrowRight, MailCheck } from "lucide-react";
import { Button } from "@tankua/ui";
import { AuthBackLink, AuthError, AuthHeading, AuthShell } from "@/components/auth-shell";

export default function ForgotPasswordPage() {
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
    <AuthShell footer={<AuthBackLink />}>
      {success ? (
        <>
          <span className="auth-state-icon"><MailCheck aria-hidden="true" size={24} /></span>
          <div role="status">
            <AuthHeading title="Check your inbox">
              We sent a reset link to <strong className="break-all">{email}</strong>. Check your spam folder if you don’t see it.
            </AuthHeading>
          </div>
          <Button type="button" variant="outline" className="auth-submit" onClick={() => setSuccess(false)}>
            Send another link
          </Button>
        </>
      ) : (
        <>
          <AuthHeading title="Reset your password">
            Enter the email address you use for your provider account.
          </AuthHeading>
          <form className="auth-form" onSubmit={handleSubmit}>
            {error ? <AuthError>{error}</AuthError> : null}
            <div className="auth-field">
              <label htmlFor="recovery-email">Work email</label>
              <input
                id="recovery-email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="auth-submit" isLoading={isLoading}>
              Send reset link <ArrowRight aria-hidden="true" size={18} />
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
