export type GlyphType = 'base' | 'combining';
export type CombiningClass = 'above' | 'below' | 'overlay' | 'unknown';

export interface GlyphSymbol {
  char: string;
  cp: number;
  name?: string;
  glyph_type: GlyphType;
  path: string;
  advance: number;
  bbox: [number, number, number, number];
  font_used: string;
  combining_class?: CombiningClass;
  path_hash?: string;
  corpus_freq?: number;
}

export interface GlyphPack {
  version: number;
  stats: { total: number; base: number; combining: number };
  role_labels?: Record<string, string>;
  symbols: Record<string, GlyphSymbol>;
}

export interface GlyphLookup {
  version: number;
  stats: { symbols: number };
  by_char: Record<string, string>;
  by_cp: Record<string, string>;
}

export interface HexFamilyEntry {
  id: string;
  members: string[];
  size: number;
}

export interface RoleCategories {
  version: number;
  description?: string;
  role_order: string[];
  role_groups: Record<string, string[]>;
  role_labels: Record<string, string>;
  counts?: Record<string, number>;
  /** @deprecated v2 — sort is baked into role_groups in v3 */
  sort?: { algorithm?: string; freq_field?: string };
  /** @deprecated v2 */
  mirror_pairs?: Record<string, string>;
  /** @deprecated v2 */
  hex_to_family?: Record<string, HexFamilyEntry>;
}

export interface Cluster {
  base: string;
  marks: string[];
}

export type Document = Cluster[];

export interface PaletteSymbol {
  key: string;
  char: string;
  glyph: GlyphSymbol;
}

export interface PaletteCategory {
  id: string;
  label: string;
  tabLabel: string;
  symbols: PaletteSymbol[];
}

export const KAOMOJI_DEMO_MAX_LENGTH = 20;
