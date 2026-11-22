"use client";

import { useEffect, useState } from "react";
import { Check, Link2, Send } from "lucide-react";
import { SITE_URL } from "@/lib/seo";

export function SharePlanActions({ path, title }: { path: string; title: string }) {
  const [url, setUrl] = useState(() => new URL(path, SITE_URL).href);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "manual">("idle");

  useEffect(() => {
    setUrl(new URL(path, window.location.origin).href);
    setCopyStatus("idle");
  }, [path]);

  const telegramUrl = `https://t.me/share/url?${new URLSearchParams({ url, text: title })}`;
  const actionClass = "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#ced0c2] bg-white px-3.5 text-sm font-semibold text-[#29372b] transition hover:bg-[#f1f2eb]";

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("manual");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={actionClass} onClick={copy}>
          {copyStatus === "copied" ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
          {copyStatus === "copied" ? "Link copied" : "Copy link"}
        </button>
        <a className={actionClass} href={telegramUrl} target="_blank" rel="noopener noreferrer">
          <Send size={16} aria-hidden="true" /> Share in Telegram
        </a>
      </div>
      <p className="sr-only" role="status">{copyStatus === "copied" ? "Share link copied." : ""}</p>
      {copyStatus === "manual" && (
        <label className="mt-3 block text-sm font-medium text-[#444b42]">
          Select and copy this link
          <input
            value={url}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
            className="mt-1.5 w-full max-w-lg rounded-lg border border-[#ced0c2] px-3 py-2"
          />
        </label>
      )}
    </div>
  );
}
