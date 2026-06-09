import type { GlyphLookup, GlyphPack, RoleCategories } from './types';

const GLYPHS_BASE = '/glyphs';

let packPromise: Promise<GlyphPack> | null = null;
let lookupPromise: Promise<GlyphLookup> | null = null;
let roleCategoriesPromise: Promise<RoleCategories> | null = null;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to load ${path}: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function loadGlyphPack(): Promise<GlyphPack> {
  if (!packPromise) {
    packPromise = fetchJson<GlyphPack>(`${GLYPHS_BASE}/editor_glyph_pack.json`);
  }
  return packPromise;
}

export function loadGlyphLookup(): Promise<GlyphLookup> {
  if (!lookupPromise) {
    lookupPromise = fetchJson<GlyphLookup>(`${GLYPHS_BASE}/editor_lookup.json`);
  }
  return lookupPromise;
}

export function loadRoleCategories(): Promise<RoleCategories> {
  if (!roleCategoriesPromise) {
    roleCategoriesPromise = fetchJson<RoleCategories>(
      `${GLYPHS_BASE}/editor_role_categories.json`,
    );
  }
  return roleCategoriesPromise;
}

export async function loadGlyphData(): Promise<{
  pack: GlyphPack;
  lookup: GlyphLookup;
  roleCategories: RoleCategories;
}> {
  const [pack, lookup, roleCategories] = await Promise.all([
    loadGlyphPack(),
    loadGlyphLookup(),
    loadRoleCategories(),
  ]);
  return { pack, lookup, roleCategories };
}
