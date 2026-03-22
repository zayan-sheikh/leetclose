import type { ReactNode } from "react";

/**
 * Lightweight markdown-like rendering for AI chat bubbles (no extra deps).
 * Supports: paragraphs (double newlines), bullet/numbered lists, **bold**, `code`.
 */
function renderInline(s: string): ReactNode {
  const out: ReactNode[] = [];
  let key = 0;
  let i = 0;
  while (i < s.length) {
    const tick = s.indexOf("`", i);
    const bold = s.indexOf("**", i);
    const nextTick = tick >= 0 ? tick : Infinity;
    const nextBold = bold >= 0 ? bold : Infinity;
    const next = Math.min(nextTick, nextBold);
    if (next === Infinity) {
      if (i < s.length) out.push(s.slice(i));
      break;
    }
    if (next > i) out.push(s.slice(i, next));
    if (next === nextTick) {
      const end = s.indexOf("`", tick + 1);
      if (end < 0) {
        out.push(s.slice(tick));
        break;
      }
      out.push(
        <code
          key={key++}
          className="rounded bg-black/35 px-1 py-0.5 font-mono text-[12px] text-zinc-100"
        >
          {s.slice(tick + 1, end)}
        </code>,
      );
      i = end + 1;
    } else {
      const end = s.indexOf("**", bold + 2);
      if (end < 0) {
        out.push(s.slice(bold));
        break;
      }
      out.push(
        <strong key={key++} className="font-semibold text-zinc-50">
          {s.slice(bold + 2, end)}
        </strong>,
      );
      i = end + 2;
    }
  }
  if (out.length === 0) return null;
  if (out.length === 1) return out[0];
  return <>{out}</>;
}

function isBulletList(lines: string[]): boolean {
  return (
    lines.length > 0 &&
    lines.every((l) => /^\s*[-*]\s/.test(l) || l.trim() === "")
  );
}

function isNumberedList(lines: string[]): boolean {
  return (
    lines.length > 0 &&
    lines.every((l) => /^\s*\d+\.\s/.test(l) || l.trim() === "")
  );
}

export default function SimpleAssistantMarkdown({
  children: text,
}: {
  children: string;
}) {
  const blocks = text.trim() ? text.split(/\n\n+/) : [];

  return (
    <div className="space-y-2 [&_p]:my-2 [&_p]:leading-relaxed [&_p]:first:mt-0 [&_p]:last:mb-0">
      {blocks.map((block, bi) => {
        const lines = block.split("\n").filter((l) => l.trim() !== "");
        if (lines.length === 0) return null;

        if (isBulletList(lines)) {
          return (
            <ul
              key={bi}
              className="my-2 list-disc space-y-1 pl-5 first:mt-0 last:mb-0"
            >
              {lines.map((line, li) => (
                <li key={li}>
                  {renderInline(line.replace(/^\s*[-*]\s+/, "").trim())}
                </li>
              ))}
            </ul>
          );
        }

        if (isNumberedList(lines)) {
          return (
            <ol
              key={bi}
              className="my-2 list-decimal space-y-1 pl-5 first:mt-0 last:mb-0"
            >
              {lines.map((line, li) => (
                <li key={li}>
                  {renderInline(line.replace(/^\s*\d+\.\s+/, "").trim())}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={bi} className="my-2 leading-relaxed first:mt-0 last:mb-0">
            {renderInline(block.trim())}
          </p>
        );
      })}
    </div>
  );
}
