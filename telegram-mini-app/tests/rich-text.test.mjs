import test from 'node:test';
import assert from 'node:assert/strict';
import { parseInline, parseRichText, richTextToPlain } from '../app/richText.js';

const sample = `Lalibela is famous for its **rock-hewn churches**.
Carved in the 12th century.

## Highlights
- Biete Ghiorgis
* Timket festival

Plan a full day.`;

test('splits paragraphs, headings and bullet lists', () => {
  assert.deepEqual(parseRichText(sample), [
    { type: 'paragraph', lines: ['Lalibela is famous for its **rock-hewn churches**.'] },
    { type: 'paragraph', lines: ['Carved in the 12th century.'] },
    { type: 'heading', text: 'Highlights' },
    { type: 'list', items: ['Biete Ghiorgis', 'Timket festival'] },
    { type: 'paragraph', lines: ['Plan a full day.'] },
  ]);
});

test('bold runs and plain text without marks', () => {
  assert.deepEqual(parseInline('a **b** c'), [
    { text: 'a ', bold: false }, { text: 'b', bold: true }, { text: ' c', bold: false },
  ]);
  assert.equal(richTextToPlain(sample),
    'Lalibela is famous for its rock-hewn churches. Carved in the 12th century. Highlights Biete Ghiorgis · Timket festival Plan a full day.');
});

test('existing plain descriptions are unchanged and empty input is safe', () => {
  assert.deepEqual(parseRichText('Just one sentence.'), [{ type: 'paragraph', lines: ['Just one sentence.'] }]);
  assert.deepEqual(parseRichText(null), []);
  assert.equal(richTextToPlain(undefined), '');
  assert.deepEqual(parseRichText('**Bold start** line'), [{ type: 'paragraph', lines: ['**Bold start** line'] }]);
  assert.deepEqual(parseRichText('<b>x</b>'), [{ type: 'paragraph', lines: ['<b>x</b>'] }]);
});
