import type {
  GlyphPack,
  PaletteCategory,
  PaletteSymbol,
  RoleCategories,
} from './types';
import {
  PALETTE_GRID_COLS_MOBILE,
  PALETTE_TEASER_ROWS,
  PALETTE_TOP_N,
} from './types';

export function getTeaserSymbolCount(
  activeCount: number,
  columns: number,
  teaserRows = PALETTE_TEASER_ROWS,
): number {
  const padCount = (columns - (activeCount % columns)) % columns;
  return padCount + teaserRows * columns;
}

export function getMaxTeaserSymbolCount(
  activeCount: number,
  teaserRows = PALETTE_TEASER_ROWS,
): number {
  return getTeaserSymbolCount(activeCount, PALETTE_GRID_COLS_MOBILE, teaserRows);
}

const ROLE_ORDER = [
  'eye',
  'mouth',
  'hands',
  'frame',
  'decor',
  'combining',
  'other',
] as const;

const ROLE_TAB_LABELS: Record<(typeof ROLE_ORDER)[number], string> = {
  eye: 'Eyes',
  mouth: 'Mouth',
  hands: 'Hands',
  frame: 'Frame',
  decor: 'Decor',
  combining: 'Overlays',
  other: 'Other',
};

function glyphFreq(pack: GlyphPack, key: string): number {
  return pack.symbols[key]?.corpus_freq ?? 0;
}

function getMirrorPartner(
  anchor: string,
  mirror: Record<string, string>,
): string | null {
  if (mirror[anchor]) return mirror[anchor];
  for (const [a, b] of Object.entries(mirror)) {
    if (b === anchor) return a;
  }
  return null;
}

export function sortRolePaletteKeys(
  keys: string[],
  roleCategories: RoleCategories,
  pack: GlyphPack,
  topN = PALETTE_TOP_N,
): string[] {
  const roleSet = new Set(keys);
  const mirror = roleCategories.mirror_pairs ?? {};
  const hexToFamily = roleCategories.hex_to_family ?? {};
  const shown = new Set<string>();
  const result: string[] = [];

  const familyMembers = (anchor: string): string[] => {
    const entry = hexToFamily[anchor];
    if (!entry?.members) return [];
    return [...entry.members]
      .filter((key) => {
        if (!roleSet.has(key) || shown.has(key) || key === anchor) return false;
        const partner = getMirrorPartner(key, mirror);
        if (partner && shown.has(partner)) return false;
        return true;
      })
      .sort((a, b) => glyphFreq(pack, b) - glyphFreq(pack, a));
  };

  while (result.length < topN) {
    const candidates = keys
      .filter((key) => !shown.has(key))
      .sort((a, b) => glyphFreq(pack, b) - glyphFreq(pack, a));
    if (candidates.length === 0) break;

    const anchor = candidates[0];
    result.push(anchor);
    shown.add(anchor);

    const partner = getMirrorPartner(anchor, mirror);
    if (partner && roleSet.has(partner) && !shown.has(partner)) {
      result.push(partner);
      shown.add(partner);
    }

    for (const member of familyMembers(anchor)) {
      result.push(member);
      shown.add(member);
    }
  }

  return result.slice(0, topN);
}

function keysToSymbols(keys: string[], pack: GlyphPack): PaletteSymbol[] {
  const resolved: PaletteSymbol[] = [];

  for (const key of keys) {
    const glyph = pack.symbols[key];
    if (!glyph) continue;
    resolved.push({ key, char: glyph.char, glyph });
  }

  return resolved;
}

function buildCategorySymbols(
  keys: string[],
  roleCategories: RoleCategories,
  pack: GlyphPack,
  topN: number,
  maxTeaserCount: number,
): { symbols: PaletteSymbol[]; teaserSymbols: PaletteSymbol[] } {
  const sortedKeys = sortRolePaletteKeys(
    keys,
    roleCategories,
    pack,
    topN + maxTeaserCount,
  );

  return {
    symbols: keysToSymbols(sortedKeys.slice(0, topN), pack),
    teaserSymbols: keysToSymbols(sortedKeys.slice(topN, topN + maxTeaserCount), pack),
  };
}

export function buildRolePalette(
  roleCategories: RoleCategories,
  pack: GlyphPack,
  topN = PALETTE_TOP_N,
): PaletteCategory[] {
  const categories: PaletteCategory[] = [];
  const maxTeaserCount = getMaxTeaserSymbolCount(topN);

  for (const roleId of ROLE_ORDER) {
    const keys = roleCategories.role_groups[roleId];
    if (!keys?.length) continue;

    const { symbols, teaserSymbols } = buildCategorySymbols(
      keys,
      roleCategories,
      pack,
      topN,
      maxTeaserCount,
    );

    categories.push({
      id: roleId,
      label: roleCategories.role_labels[roleId] ?? roleId,
      tabLabel: ROLE_TAB_LABELS[roleId],
      symbols,
      teaserSymbols,
    });
  }

  return categories;
}
