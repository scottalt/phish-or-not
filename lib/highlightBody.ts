export interface Segment {
  text: string;
  highlighted: boolean;
}

export function highlightBody(body: string, highlights: string[]): Segment[] {
  if (!highlights.length) return [{ text: body, highlighted: false }];

  const escaped = highlights.map((h) =>
    h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const splitPattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const matchPattern = new RegExp(`^(${escaped.join('|')})$`, 'i');

  return body
    .split(splitPattern)
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      highlighted: matchPattern.test(part),
    }));
}
