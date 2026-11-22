import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";

export function ProviderBrand({ href = "/login", onClick }: { href?: string; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="provider-brand">
      <span className="provider-brand-mark">
        <Image src="/favicon.png" alt="" width={28} height={28} />
      </span>
      <span className="provider-brand-copy">
        <strong>Tankua</strong>
        <span>Provider portal</span>
      </span>
    </Link>
  );
}

export function AuthShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="auth-layout">
      <div className="auth-column">
        <div className="auth-brand-line"><ProviderBrand /></div>
        <div className="auth-content" data-enter>{children}</div>
        {footer ? <div className="auth-footer">{footer}</div> : null}
      </div>
      <div className="auth-landscape" aria-hidden="true">
        <Image src="/simien-mountains.webp" alt="" fill unoptimized sizes="(min-width: 900px) 50vw, 1px" />
        <div className="auth-landscape-copy">
          <p>Run your trips<br />from one place.</p>
          <span>Simien Mountains, Ethiopia</span>
        </div>
      </div>
    </main>
  );
}

export function AuthHeading({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="auth-heading">
      <h1>{title}</h1>
      <p>{children}</p>
    </div>
  );
}

export function AuthError({ children }: { children: string }) {
  return (
    <p className="auth-error" role="alert">
      <AlertCircle aria-hidden="true" size={18} />
      <span>{children}</span>
    </p>
  );
}

export function AuthBackLink() {
  return <Link href="/login" className="auth-link"><ArrowLeft aria-hidden="true" size={16} /> Back to sign in</Link>;
}

export function AuthPasswordField({ id, label, value, onChange, visible, onToggle, autoComplete }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete: "current-password" | "new-password";
}) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
        />
        <button type="button" onClick={onToggle} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}>
          {visible ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}
        </button>
      </div>
    </div>
  );
}
