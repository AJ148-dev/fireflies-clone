export function HighlightText({ text, needle }: { text: string; needle: string }) {
  const term = needle.trim().toLowerCase();
  if (!term) return <>{text}</>;
  const lower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const found = lower.indexOf(term, cursor);
    if (found === -1) {
      parts.push(text.slice(cursor));
      break;
    }
    if (found > cursor) parts.push(text.slice(cursor, found));
    parts.push(
      <mark key={found} className="rounded-sm bg-[#ffe8a3] px-0.5 text-inherit">
        {text.slice(found, found + term.length)}
      </mark>,
    );
    cursor = found + term.length;
  }
  return <>{parts}</>;
}
