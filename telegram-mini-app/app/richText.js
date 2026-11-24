/**
 * Lightweight formatting for destination descriptions.
 * Same rules as src/utils/richText.js (mobile) and web/packages/ui/src/lib/rich-text.ts.
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
export function parseRichText(text) {
  const blocks = [];
  let list = null;
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
        list = { type: 'list', items: [] };
        blocks.push(list);
      }
      list.items.push(bullet[1].trim());
      continue;
    }
    list = null;
    blocks.push({ type: 'paragraph', lines: [line] });
  }
  return blocks;
}

/** Split a line into runs: [{ text, bold }]. */
export function parseInline(text) {
  const runs = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match;
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
export function richTextToPlain(text) {
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
