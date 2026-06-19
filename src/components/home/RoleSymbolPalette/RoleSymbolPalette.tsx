import { useState } from 'react';
import { getFontFamily } from '../../../lib/glyphs';
import type { PaletteCategory, PaletteSymbol } from '../../../lib/glyphs';
import styles from './RoleSymbolPalette.module.css';

interface RoleSymbolPaletteProps {
  categories: PaletteCategory[];
  onSymbolPick: (symbol: string) => void;
}

function SymbolCell({
  item,
  onPick,
}: {
  item: PaletteSymbol;
  onPick?: (symbol: string) => void;
}) {
  return (
    <button
      type="button"
      className={styles.symbolBtn}
      title={item.glyph.name ?? item.char}
      onPointerDown={(e) => e.preventDefault()}
      onClick={() => onPick?.(item.char)}
    >
      <span
        className={`kao ${styles.symbolChar}`}
        style={{ fontFamily: getFontFamily(item.glyph.font_used) }}
      >
        {item.char.trim() === '' ? '␣' : item.char}
      </span>
    </button>
  );
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
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => setCategoryId(cat.id)}
          >
            {cat.tabLabel}
          </button>
        ))}
      </div>
      <div className={styles.paletteBody}>
        <div className={styles.gridScroll}>
          <div className={styles.grid}>
            {category.symbols.map((item) => (
              <SymbolCell
                key={`${category.id}-${item.key}`}
                item={item}
                onPick={onSymbolPick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
