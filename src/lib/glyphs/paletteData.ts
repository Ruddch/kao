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

function buildCategorySymbols(
  keys: string[],
  roleCategories: RoleCategories,
  pack: GlyphPack,
  topN: number,
): PaletteSymbol[] {
  const sortedKeys = sortRolePaletteKeys(keys, roleCategories, pack, topN);
  const resolved: PaletteSymbol[] = [];

  for (const key of sortedKeys) {
    const glyph = pack.symbols[key];
    if (!glyph) continue;
    resolved.push({ key, char: glyph.char, glyph });
  }

  return resolved;
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
      symbols: buildCategorySymbols(keys, roleCategories, pack, topN),
    });
  }

  return categories;
}
