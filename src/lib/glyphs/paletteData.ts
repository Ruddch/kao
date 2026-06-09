import type {
  GlyphPack,
  PaletteCategory,
  PaletteSymbol,
  RoleCategories,
} from './types';
import { PALETTE_TOP_N } from './types';

const ROLE_ORDER = [
  'eye',
  'mouth',
  'hand_left',
  'hand_right',
  'decor',
  'combining',
  'other',
] as const;

const ROLE_TAB_LABELS: Record<(typeof ROLE_ORDER)[number], string> = {
  eye: 'Eyes',
  mouth: 'Mouth',
  hand_left: 'L. Hand',
  hand_right: 'R. Hand',
  decor: 'Decor',
  combining: 'Overlays',
  other: 'Other',
};

function buildCategorySymbols(
  keys: string[],
  pack: GlyphPack,
  topN: number,
): PaletteSymbol[] {
  const resolved: PaletteSymbol[] = [];

  for (const key of keys) {
    const glyph = pack.symbols[key];
    if (!glyph) continue;
    resolved.push({ key, char: glyph.char, glyph });
  }

  resolved.sort((a, b) => (b.glyph.corpus_freq ?? 0) - (a.glyph.corpus_freq ?? 0));
  return resolved.slice(0, topN);
}

export function buildRolePalette(
  roleCategories: RoleCategories,
  pack: GlyphPack,
  topN = PALETTE_TOP_N,
): PaletteCategory[] {
  const categories: PaletteCategory[] = [];

  for (const roleId of ROLE_ORDER) {
    const keys = roleCategories.role_groups[roleId];
    if (!keys?.length) continue;

    categories.push({
      id: roleId,
      label: roleCategories.role_labels[roleId] ?? roleId,
      tabLabel: ROLE_TAB_LABELS[roleId],
      symbols: buildCategorySymbols(keys, pack, topN),
    });
  }

  return categories;
}
