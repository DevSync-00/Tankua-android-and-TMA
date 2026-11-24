/**
 * Lightweight formatting for destination descriptions.
 * Same rules as src/utils/richText.js (mobile) and telegram-mini-app/app/richText.js.
 *
 *   ## Heading         a section heading (#, ## or ###)
 *   - item / * item    a bullet point
 *   **bold**           bold text
 *   each line          is its own paragraph (blank lines are ignored)
 *
 * Anything else is plain text; no HTML is ever interpreted.
 */

const HEADING = /^#{1,3}\s+(.+)$/;
const BULLET = /^[-*•]\s+(.+)$/;

/** Split text into blocks: { type: 'heading', text } | { type: 'paragraph', lines } | { type: 'list', items }. */
export type RichTextBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "list"; items: string[] };

export function parseRichText(text: string | null | undefined): RichTextBlock[] {
  const blocks: RichTextBlock[] = [];
  let list: { type: "list"; items: string[] } | null = null;
  for (const raw of String(text || '').replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) {
      list = null;
      continue;
    }
    const heading = line.match(HEADING);
    if (heading) {
      list = null;
      blocks.push({ type: 'heading', text: heading[1].trim() });
      continue;
    }
    const bullet = line.match(BULLET);
    if (bullet) {
      if (!list) {
        list = { type: "list", items: [] };
        blocks.push(list);
      }
      list.items.push(bullet[1].trim());
      continue;
    }
    list = null;
    blocks.push({ type: "paragraph", lines: [line] });
  }
  return blocks;
}

/** Split a line into runs: [{ text, bold }]. */
export function parseInline(text: string | null | undefined): { text: string; bold: boolean }[] {
  const runs: { text: string; bold: boolean }[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  const source = String(text || '');
  while ((match = pattern.exec(source))) {
    if (match.index > last) runs.push({ text: source.slice(last, match.index), bold: false });
    runs.push({ text: match[1], bold: true });
    last = pattern.lastIndex;
  }
  if (last < source.length) runs.push({ text: source.slice(last), bold: false });
  return runs;
}

/** The description without formatting marks, for previews, cards and search snippets. */
export function richTextToPlain(text: string | null | undefined): string {
  return parseRichText(text)
    .map((block) => {
      if (block.type === 'heading') return block.text;
      if (block.type === 'list') return block.items.join(' · ');
      return block.lines.join(' ');
    })
    .map((part) => part.replace(/\*\*(.+?)\*\*/g, '$1'))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
