"use client";

import type { ButtonHTMLAttributes } from "react";
import { getPreferredStoreUrl } from "@/lib/app-stores";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

/** Sends mobile users to App Store / Play Store; otherwise opens the marketing download page. */
export function AppDownloadButton({ children, type = "button", onClick, ...rest }: Props) {
  return (
    <button
      type={type}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        window.location.assign(getPreferredStoreUrl());
      }}
    >
      {children}
    </button>
  );
}
