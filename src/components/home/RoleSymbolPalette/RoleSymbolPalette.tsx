import { useEffect, useState } from 'react';
import {
  getFontFamily,
  getTeaserSymbolCount,
  PALETTE_GRID_COLS_DESKTOP,
  PALETTE_GRID_COLS_MOBILE,
  PALETTE_TOP_N,
} from '../../../lib/glyphs';
import type { PaletteCategory, PaletteSymbol } from '../../../lib/glyphs';
import styles from './RoleSymbolPalette.module.css';

interface RoleSymbolPaletteProps {
  categories: PaletteCategory[];
  onSymbolPick: (symbol: string) => void;
}

function usePaletteColumns(): number {
  const [columns, setColumns] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
      ? PALETTE_GRID_COLS_MOBILE
      : PALETTE_GRID_COLS_DESKTOP,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () =>
      setColumns(mq.matches ? PALETTE_GRID_COLS_MOBILE : PALETTE_GRID_COLS_DESKTOP);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return columns;
}

function getTeaserDepthClass(
  index: number,
  total: number,
  columns: number,
): string {
  const row = Math.floor(index / columns);
  const rows = Math.ceil(total / columns);
  const depthFromBottom = rows - 1 - row;

  if (depthFromBottom <= 0) return styles.teaserDeep;
  if (depthFromBottom === 1) return styles.teaserMid;
  return styles.teaserLight;
}

function SymbolCell({
  item,
  className,
  disabled,
  onPick,
}: {
  item: PaletteSymbol;
  className?: string;
  disabled?: boolean;
  onPick?: (symbol: string) => void;
}) {
  return (
    <button
      type="button"
      className={[styles.symbolBtn, className].filter(Boolean).join(' ')}
      title={disabled ? undefined : `Insert ${item.char}`}
      disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      aria-hidden={disabled ? true : undefined}
      onPointerDown={disabled ? undefined : (e) => e.preventDefault()}
      onClick={disabled ? undefined : () => onPick?.(item.char)}
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
  const columns = usePaletteColumns();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const category = categories.find((c) => c.id === categoryId) ?? categories[0];

  if (!category) {
    return null;
  }

  const teaserCount = getTeaserSymbolCount(PALETTE_TOP_N, columns);
  const teasers = category.teaserSymbols.slice(0, teaserCount);
  const hasTeasers = teasers.length > 0;

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
          <div className={styles.gridContent}>
            <div className={styles.grid}>
              {category.symbols.map((item) => (
                <SymbolCell
                  key={`${category.id}-${item.key}`}
                  item={item}
                  onPick={onSymbolPick}
                />
              ))}
              {teasers.map((item, index) => (
                <SymbolCell
                  key={`${category.id}-teaser-${item.key}`}
                  item={item}
                  disabled
                  className={getTeaserDepthClass(index, teasers.length, columns)}
                />
              ))}
            </div>
            {hasTeasers && <div className={styles.gridFade} aria-hidden="true" />}
          </div>
        </div>
      </div>
    </div>
  );
}
