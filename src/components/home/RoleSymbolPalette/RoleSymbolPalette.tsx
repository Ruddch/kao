import { useState } from 'react';
import { getFontFamily } from '../../../lib/glyphs';
import type { PaletteCategory } from '../../../lib/glyphs';
import styles from './RoleSymbolPalette.module.css';

interface RoleSymbolPaletteProps {
  categories: PaletteCategory[];
  onSymbolPick: (symbol: string) => void;
}

export function RoleSymbolPalette({ categories, onSymbolPick }: RoleSymbolPaletteProps) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const category = categories.find((c) => c.id === categoryId) ?? categories[0];

  if (!category) {
    return null;
  }

  return (
    <div className={styles.root}>
      <div className={styles.tabs}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={categoryId === cat.id ? styles.tabActive : styles.tab}
            title={cat.label}
            onClick={() => setCategoryId(cat.id)}
          >
            {cat.tabLabel}
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        {category.symbols.map((item) => (
          <button
            key={`${category.id}-${item.key}`}
            type="button"
            className={styles.symbolBtn}
            title={`Insert ${item.char}`}
            onClick={() => onSymbolPick(item.char)}
          >
            <span
              className={`kao ${styles.symbolChar}`}
              style={{ fontFamily: getFontFamily(item.glyph.font_used) }}
            >
              {item.char.trim() === '' ? '␣' : item.char}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
