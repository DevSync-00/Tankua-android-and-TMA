"use client";

import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export interface InlineBannerProps {
  variant?: "error" | "warning" | "success" | "info";
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const VARIANT_MAP = {
  error: {
    bg: "bg-red-500/10 border-red-500/20 text-red-400",
    iconColor: "text-red-500",
    Icon: AlertCircle,
  },
  warning: {
    bg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    iconColor: "text-amber-500",
    Icon: AlertTriangle,
  },
  success: {
    bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    iconColor: "text-emerald-500",
    Icon: CheckCircle2,
  },
  info: {
    bg: "bg-sky-500/10 border-sky-500/20 text-sky-400",
    iconColor: "text-sky-500",
    Icon: Info,
  },
};

export const InlineBanner: React.FC<InlineBannerProps> = ({
  variant = "error",
  title,
  message,
  onDismiss,
  className = "",
}) => {
  const { bg, iconColor, Icon } = VARIANT_MAP[variant] || VARIANT_MAP.error;

  if (!message && !title) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border ${bg} ${className} transition`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
      <div className="flex-1 space-y-0.5 text-sm">
        {title && <p className="font-semibold text-white">{title}</p>}
        <p className="leading-relaxed opacity-90">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
