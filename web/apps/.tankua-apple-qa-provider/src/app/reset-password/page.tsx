"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleCheck } from "lucide-react";
import { Button, buttonVariants, cn } from "@tankua/ui";
import { AuthBackLink, AuthError, AuthHeading, AuthPasswordField, AuthShell } from "@/components/auth-shell";

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

  return (
    <AuthShell footer={<AuthBackLink />}>
      {isValidToken === null ? (
        <p role="status" className="text-sm text-muted-foreground">Checking your reset link…</p>
      ) : isValidToken === false ? (
        <>
          <AuthHeading title="Reset link expired">
            Your reset link is invalid or has expired. Request a new one to choose a password.
          </AuthHeading>
          <Link href="/forgot-password" className={cn(buttonVariants(), "auth-submit")}>Request a new link <ArrowRight aria-hidden="true" size={18} /></Link>
        </>
      ) : success ? (
        <>
          <span className="auth-state-icon"><CircleCheck aria-hidden="true" size={24} /></span>
          <AuthHeading title="Password updated">
            You can now sign in with your new password.
          </AuthHeading>
          <Link href="/login" className={cn(buttonVariants(), "auth-submit")}>Sign in <ArrowRight aria-hidden="true" size={18} /></Link>
        </>
      ) : (
        <>
          <AuthHeading title="Set a new password">
            Use at least eight characters to secure your provider account.
          </AuthHeading>
          <form className="auth-form" onSubmit={handleSubmit}>
            {error ? <AuthError>{error}</AuthError> : null}
            <AuthPasswordField
              id="new-password"
              label="New password"
              value={password}
              onChange={setPassword}
              visible={showPassword}
              onToggle={() => setShowPassword((visible) => !visible)}
              autoComplete="new-password"
            />
            <AuthPasswordField
              id="confirm-password"
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((visible) => !visible)}
              autoComplete="new-password"
            />
            <Button type="submit" className="auth-submit" isLoading={isLoading}>
              Update password <ArrowRight aria-hidden="true" size={18} />
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
