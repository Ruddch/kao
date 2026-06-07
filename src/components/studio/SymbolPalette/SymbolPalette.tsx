import { useState } from 'react';
import { SYMBOL_CATEGORIES } from '../../../data/mock/kaomojiEditor';
import styles from './SymbolPalette.module.css';

interface SymbolPaletteProps {
  onSymbolPick: (symbol: string) => void;
}

export function SymbolPalette({ onSymbolPick }: SymbolPaletteProps) {
  const [categoryId, setCategoryId] = useState(SYMBOL_CATEGORIES[0].id);
  const category = SYMBOL_CATEGORIES.find((c) => c.id === categoryId) ?? SYMBOL_CATEGORIES[0];

  return (
    <div className={styles.root}>
      <div className={styles.tabs}>
        {SYMBOL_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={categoryId === cat.id ? styles.tabActive : styles.tab}
            onClick={() => setCategoryId(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        {category.symbols.map((symbol) => (
          <button
            key={`${category.id}-${symbol}`}
            type="button"
            className={styles.symbolBtn}
            title={`Insert ${symbol}`}
            onClick={() => onSymbolPick(symbol)}
          >
            <span className={`kao ${styles.symbolChar}`}>{symbol}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
