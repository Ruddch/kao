import { clustersToText } from './clustersToText';
import type { Document, GlyphLookup, GlyphPack } from './types';

export const MAX_MARKS_PER_CLUSTER = 4;

function isIgnorableService(ch: string): boolean {
  const cp = ch.codePointAt(0);
  if (cp === undefined) return true;
  if (cp === 0xfe0f || cp === 0x200d) return true;
  if (cp >= 0x1f000 && cp <= 0x1ffff) return true;
  if (cp === 0x200b || cp === 0xfeff) return true;
  if (cp === 0x09 || cp === 0x0a || cp === 0x0d) return true;
  return false;
}

export type ParseResult =
  | { ok: true; clusters: Document }
  | { ok: false; error: 'unsupported_symbols'; unsupported: string[] }
  | { ok: false; error: 'combining_without_base'; char: string }
  | { ok: false; error: 'too_many_marks'; clusterIndex: number };

export function parseText(
  text: string,
  pack: GlyphPack,
  lookup: GlyphLookup,
): ParseResult {
  const clusters: Document = [];
  const unsupported: string[] = [];

  for (const ch of [...text]) {
    const key = lookup.by_char[ch];

    if (key) {
      const sym = pack.symbols[key];
      if (!sym) {
        unsupported.push(ch);
        continue;
      }

      if (sym.glyph_type === 'base') {
        clusters.push({ base: key, marks: [] });
      } else {
        if (clusters.length === 0) {
          return { ok: false, error: 'combining_without_base', char: ch };
        }
        const cluster = clusters[clusters.length - 1];
        if (cluster.marks.length >= MAX_MARKS_PER_CLUSTER) {
          return { ok: false, error: 'too_many_marks', clusterIndex: clusters.length - 1 };
        }
        cluster.marks.push(key);
      }
      continue;
    }

    if (isIgnorableService(ch)) continue;
    if (ch.trim() === '') continue;

    unsupported.push(ch);
  }

  if (unsupported.length > 0) {
    return { ok: false, error: 'unsupported_symbols', unsupported };
  }

  return { ok: true, clusters };
}

export function insertCharAtCaret(
  clusters: Document,
  caret: number,
  char: string,
  pack: GlyphPack,
  lookup: GlyphLookup,
): ParseResult {
  const text = clustersToText(clusters, pack);
  const chars = [...text];
  const nextText = chars.slice(0, caret).join('') + char + chars.slice(caret).join('');
  return parseText(nextText, pack, lookup);
}
