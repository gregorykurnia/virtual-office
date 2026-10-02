import { Fragment, type ReactNode } from "react";

const INLINE_TOKEN = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\*([^*]+)\*|_([^_]+)_)/g;

/**
 * Keep report rendering deliberately small and dependency-free for the demo.
 * Text is always passed to React as text, so raw HTML is never interpreted.
 * Links are created only for explicitly allowed protocols.
 */
export function getSafeHref(value: string): string | null {
  const href = value.trim();
  if (href.startsWith("/") || href.startsWith("#")) return href;

  try {
    const protocol = new URL(href).protocol.toLowerCase();
    return ["http:", "https:", "mailto:"].includes(protocol) ? href : null;
  } catch {
    return null;
  }
}

function renderInline(source: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  INLINE_TOKEN.lastIndex = 0;
  while ((match = INLINE_TOKEN.exec(source)) !== null) {
    if (match.index > lastIndex) nodes.push(source.slice(lastIndex, match.index));

    const key = `${keyPrefix}-${index}`;
    const linkLabel = match[2];
    const linkHref = match[3];
    if (linkLabel && linkHref) {
      const safeHref = getSafeHref(linkHref);
      nodes.push(safeHref ? (
        <a key={key} href={safeHref} target="_blank" rel="noreferrer">
          {linkLabel}
        </a>
      ) : linkLabel);
    } else if (match[4] || match[5]) {
      nodes.push(<strong key={key}>{match[4] ?? match[5]}</strong>);
    } else if (match[6]) {
      nodes.push(<code key={key}>{match[6]}</code>);
    } else if (match[7] || match[8]) {
      nodes.push(<em key={key}>{match[7] ?? match[8]}</em>);
    }

    lastIndex = match.index + match[0].length;
    index += 1;
  }

  if (lastIndex < source.length) nodes.push(source.slice(lastIndex));
  return nodes;
}

function isBullet(line: string): boolean {
  return /^\s*[-*+]\s+/.test(line);
}

function isOrderedItem(line: string): boolean {
  return /^\s*\d+[.)]\s+/.test(line);
}

function isBlockStart(line: string): boolean {
  return /^(#{1,3})\s+/.test(line) || isBullet(line) || isOrderedItem(line) || /^>\s?/.test(line);
}

export default function MarkdownContent({ source }: { source: string }) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  let blockIndex = 0;

  while (index < lines.length) {
    const line = lines[index]?.trimEnd() ?? "";
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const headingMarks = heading[1] ?? "#";
      const headingText = heading[2] ?? "";
      const Heading = `h${headingMarks.length}` as "h1" | "h2" | "h3";
      blocks.push(<Heading key={`block-${blockIndex}`}>{renderInline(headingText, `heading-${blockIndex}`)}</Heading>);
      blockIndex += 1;
      index += 1;
      continue;
    }

    if (isBullet(line)) {
      const items: ReactNode[] = [];
      while (index < lines.length && isBullet(lines[index] ?? "")) {
        const item = (lines[index] ?? "").replace(/^\s*[-*+]\s+/, "");
        items.push(<li key={`item-${items.length}`}>{renderInline(item, `list-${blockIndex}-${items.length}`)}</li>);
        index += 1;
      }
      blocks.push(<ul key={`block-${blockIndex}`}>{items}</ul>);
      blockIndex += 1;
      continue;
    }

    if (isOrderedItem(line)) {
      const items: ReactNode[] = [];
      while (index < lines.length && isOrderedItem(lines[index] ?? "")) {
        const item = (lines[index] ?? "").replace(/^\s*\d+[.)]\s+/, "");
        items.push(<li key={`item-${items.length}`}>{renderInline(item, `ordered-${blockIndex}-${items.length}`)}</li>);
        index += 1;
      }
      blocks.push(<ol key={`block-${blockIndex}`}>{items}</ol>);
      blockIndex += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index] ?? "")) {
        quoteLines.push((lines[index] ?? "").replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(
        <blockquote key={`block-${blockIndex}`}>
          {quoteLines.map((quoteLine, quoteIndex) => (
            <Fragment key={`quote-${quoteIndex}`}>
              {quoteIndex > 0 ? <br /> : null}
              {renderInline(quoteLine, `quote-${blockIndex}-${quoteIndex}`)}
            </Fragment>
          ))}
        </blockquote>
      );
      blockIndex += 1;
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (index < lines.length) {
      const nextLine = lines[index]?.trimEnd() ?? "";
      if (!nextLine.trim() || isBlockStart(nextLine)) break;
      paragraphLines.push(nextLine);
      index += 1;
    }
    blocks.push(
      <p key={`block-${blockIndex}`}>
        {paragraphLines.map((paragraphLine, paragraphIndex) => (
          <Fragment key={`line-${paragraphIndex}`}>
            {paragraphIndex > 0 ? <br /> : null}
            {renderInline(paragraphLine, `paragraph-${blockIndex}-${paragraphIndex}`)}
          </Fragment>
        ))}
      </p>
    );
    blockIndex += 1;
  }

  return <div className="markdown-content">{blocks}</div>;
}
