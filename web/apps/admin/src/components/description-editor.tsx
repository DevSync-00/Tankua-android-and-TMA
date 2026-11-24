"use client";

import { useRef, useState } from "react";
import { Bold, Heading2, List, Pilcrow } from "lucide-react";
import { RichText, cn } from "@tankua/ui";

interface DescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Textarea with a small formatting toolbar and a live preview.
 * Writes the plain-text formatting that every Tankua app renders:
 * "## Heading", "- bullet", "**bold**", blank line between paragraphs.
 */
export function DescriptionEditor({ value, onChange, placeholder }: DescriptionEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");

  const apply = (next: string, selectStart: number, selectEnd: number) => {
    onChange(next);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(selectStart, selectEnd);
    });
  };

  const wrapBold = () => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = value.slice(start, end) || "bold text";
    const next = `${value.slice(0, start)}**${selected}**${value.slice(end)}`;
    apply(next, start + 2, start + 2 + selected.length);
  };

  // Adds (or removes) a prefix on every line the selection touches.
  const toggleLinePrefix = (prefix: string, matcher: RegExp) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const nextBreak = value.indexOf("\n", end);
    const lineEnd = nextBreak === -1 ? value.length : nextBreak;
    const lines = value.slice(lineStart, lineEnd).split("\n");
    const allHave = lines.every((line) => matcher.test(line) || !line.trim());
    const changed = lines
      .map((line) => {
        if (!line.trim()) return line;
        const bare = line.replace(/^(#{1,3}|[-*•])\s+/, "");
        return allHave ? bare : `${prefix}${bare}`;
      })
      .join("\n");
    const next = value.slice(0, lineStart) + changed + value.slice(lineEnd);
    apply(next, lineStart, lineStart + changed.length);
  };

  const addParagraphBreak = () => {
    const el = ref.current;
    if (!el) return;
    const at = el.selectionEnd;
    const next = `${value.slice(0, at)}\n\n${value.slice(at)}`;
    apply(next, at + 2, at + 2);
  };

  const tools = [
    { label: "Heading", icon: Heading2, run: () => toggleLinePrefix("## ", /^#{1,3}\s+/) },
    { label: "Bullet list", icon: List, run: () => toggleLinePrefix("- ", /^[-*•]\s+/) },
    { label: "Bold", icon: Bold, run: wrapBold },
    { label: "New paragraph", icon: Pilcrow, run: addParagraphBreak },
  ];

  return (
    <div className="rounded-xl border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
        {(["write", "preview"] as const).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium capitalize",
              tab === name ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {name}
          </button>
        ))}
        <div className="mx-1 h-4 w-px bg-border" />
        {tools.map(({ label, icon: Icon, run }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            disabled={tab !== "write"}
            onClick={run}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {tab === "write" ? (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={8}
          className="block w-full resize-y bg-transparent px-4 py-3 text-sm leading-6 outline-none"
        />
      ) : (
        <div className="min-h-[12rem] px-4 py-3 text-sm leading-6 text-muted-foreground">
          {value.trim() ? <RichText text={value} /> : <p>Nothing to preview yet.</p>}
        </div>
      )}

      <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <code>## Heading</code> · <code>- bullet</code> · <code>**bold**</code> · blank line for a new paragraph
      </p>
    </div>
  );
}
