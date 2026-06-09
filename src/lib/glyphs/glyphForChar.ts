import { getFontFamily } from './fontMap';
import type { GlyphLookup, GlyphPack, GlyphSymbol } from './types';

export function getGlyphForChar(
  char: string,
  pack: GlyphPack,
  lookup: GlyphLookup,
): GlyphSymbol | null {
  const key = lookup.by_char[char];
  if (!key) return null;
  return pack.symbols[key] ?? null;
}

export function getFontFamilyForChar(
  char: string,
  pack: GlyphPack,
  lookup: GlyphLookup,
): string {
  const glyph = getGlyphForChar(char, pack, lookup);
  if (!glyph) return 'var(--font-kao)';
  return getFontFamily(glyph.font_used);
}
