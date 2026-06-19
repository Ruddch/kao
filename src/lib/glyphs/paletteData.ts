import type {
  GlyphPack,
  PaletteCategory,
  PaletteSymbol,
  RoleCategories,
} from './types';

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

export function buildRolePalette(
  roleCategories: RoleCategories,
  pack: GlyphPack,
): PaletteCategory[] {
  const categories: PaletteCategory[] = [];
  const roleOrder = reorderPaletteTabs(
    roleCategories.role_order ?? Object.keys(roleCategories.role_groups),
  );

  for (const roleId of roleOrder) {
    const keys = roleCategories.role_groups[roleId];
    if (!keys?.length) continue;

    categories.push({
      id: roleId,
      label: roleCategories.role_labels[roleId] ?? roleId,
      tabLabel: roleTabLabel(roleId, roleCategories.role_labels),
      symbols: keysToSymbols(keys, pack),
    });
  }

  return categories;
}
