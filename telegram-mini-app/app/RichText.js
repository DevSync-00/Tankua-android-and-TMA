import { Fragment } from 'react';
import { parseInline, parseRichText } from './richText';

function Inline({ text }) {
  return parseInline(text).map((run, index) =>
    run.bold ? <strong key={index}>{run.text}</strong> : <Fragment key={index}>{run.text}</Fragment>
  );
}

/** Renders a formatted description (headings, bullets, bold, paragraphs). Never interprets HTML. */
export default function RichText({ text, className = '' }) {
  const blocks = parseRichText(text);
  if (!blocks.length) return null;
  return (
    <div className={`rich-text ${className}`.trim()}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') return <h3 key={index}><Inline text={block.text}/></h3>;
        if (block.type === 'list') {
          return <ul key={index}>{block.items.map((item, i) => <li key={i}><Inline text={item}/></li>)}</ul>;
        }
        return (
          <p key={index}>
            {block.lines.map((line, i) => <Fragment key={i}>{i > 0 && <br/>}<Inline text={line}/></Fragment>)}
          </p>
        );
      })}
    </div>
  );
}
