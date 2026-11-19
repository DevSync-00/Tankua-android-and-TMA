import Link from "next/link";
import { ArrowRight, CircleCheck, Clock3, Mail } from "lucide-react";
import { AuthHeading, AuthShell } from "@/components/auth-shell";

export default function RegistrationSuccessPage() {
  return (
    <AuthShell footer={<p>Questions? <a className="auth-link" href="mailto:support@tankua.et">Contact support</a></p>}>
      <span className="auth-state-icon"><CircleCheck aria-hidden="true" size={24} /></span>
      <AuthHeading title="Application submitted">
        We’ll review your company details and documents before opening your provider account.
      </AuthHeading>
      <ul className="mb-6 divide-y divide-border border-y border-border">
        <li className="flex items-start gap-3 py-4">
          <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">Check your email</p>
            <p className="mt-1 text-sm text-muted-foreground">Look for your application confirmation and updates from Tankua.</p>
          </div>
        </li>
        <li className="flex items-start gap-3 py-4">
          <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">Allow time for review</p>
            <p className="mt-1 text-sm text-muted-foreground">Review usually takes 1–2 business days. You can sign in after we approve your account.</p>
          </div>
        </li>
      </ul>
      <Link href="/login" className="auth-submit inline-flex items-center justify-center bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        Back to sign in <ArrowRight aria-hidden="true" size={18} />
      </Link>
    </AuthShell>
  );
}
