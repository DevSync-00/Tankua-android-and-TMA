import * as React from "react";
import { cn } from "../lib/utils";
import { parseInline, parseRichText } from "../lib/rich-text";

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((run, index) =>
        run.bold ? (
          <strong key={index} className="font-semibold text-foreground">{run.text}</strong>
        ) : (
          <React.Fragment key={index}>{run.text}</React.Fragment>
        ),
      )}
    </>
  );
}

export interface RichTextProps {
  text: string | null | undefined;
  className?: string;
  headingClassName?: string;
}

/** Renders a formatted description (see lib/rich-text.ts for the rules). Never interprets HTML. */
export function RichText({ text, className, headingClassName }: RichTextProps) {
  const blocks = parseRichText(text);
  if (blocks.length === 0) return null;
  return (
    <div className={cn("space-y-3", className)}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h3 key={index} className={cn("pt-1 text-base font-semibold text-foreground", headingClassName)}>
              <Inline text={block.text} />
            </h3>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}><Inline text={item} /></li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index}>
            {block.lines.map((line, lineIndex) => (
              <React.Fragment key={lineIndex}>
                {lineIndex > 0 && <br />}
                <Inline text={line} />
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
