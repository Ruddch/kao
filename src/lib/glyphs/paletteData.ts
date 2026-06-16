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

const TRAILING_TAB_ROLES = ['combining', 'layout'] as const;

function reorderPaletteTabs(roleOrder: string[]): string[] {
  const trailing = TRAILING_TAB_ROLES.filter((role) => roleOrder.includes(role));
  const leading = roleOrder.filter(
    (role) => !(TRAILING_TAB_ROLES as readonly string[]).includes(role),
  );
  return [...leading, ...trailing];
}

function roleTabLabel(roleId: string, roleLabels: Record<string, string>): string {
  const full = roleLabels[roleId];
  if (full) {
    return full.split(/[\s(]/)[0] ?? roleId;
  }
  return roleId.charAt(0).toUpperCase() + roleId.slice(1);
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
  pack: GlyphPack,
  topN: number,
  maxTeaserCount: number,
): { symbols: PaletteSymbol[]; teaserSymbols: PaletteSymbol[] } {
  const visibleCount = topN + maxTeaserCount;

  return {
    symbols: keysToSymbols(keys.slice(0, topN), pack),
    teaserSymbols: keysToSymbols(keys.slice(topN, visibleCount), pack),
  };
}

export function buildRolePalette(
  roleCategories: RoleCategories,
  pack: GlyphPack,
  topN = PALETTE_TOP_N,
): PaletteCategory[] {
  const categories: PaletteCategory[] = [];
  const maxTeaserCount = getMaxTeaserSymbolCount(topN);
  const roleOrder = reorderPaletteTabs(
    roleCategories.role_order ?? Object.keys(roleCategories.role_groups),
  );

  for (const roleId of roleOrder) {
    const keys = roleCategories.role_groups[roleId];
    if (!keys?.length) continue;

    const { symbols, teaserSymbols } = buildCategorySymbols(
      keys,
      pack,
      topN,
      maxTeaserCount,
    );

    categories.push({
      id: roleId,
      label: roleCategories.role_labels[roleId] ?? roleId,
      tabLabel: roleTabLabel(roleId, roleCategories.role_labels),
      symbols,
      teaserSymbols,
    });
  }

  return categories;
}
