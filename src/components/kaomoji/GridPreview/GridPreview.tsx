import { useEffect, useState } from 'react';
import { KAOMOJI_POOL } from '../../../data/mock/nfts';
import { KaomojiCell } from '../KaomojiCell';
import styles from './GridPreview.module.css';

const GRID_SIZE = 25;
const BGS = ['white', 'cyan', 'pink', 'green', 'yellow', 'blue'] as const;

export function GridPreview() {
  const [cells] = useState(() =>
    KAOMOJI_POOL.slice(0, GRID_SIZE).map((kao, i) => ({
      kaomoji: kao,
      bg: BGS[i % BGS.length],
    })),
  );
  const [centerIdx, setCenterIdx] = useState(12);
  const [centerKao, setCenterKao] = useState(cells[12]?.kaomoji ?? '(◕‿◕)');

  useEffect(() => {
    const interval = setInterval(() => {
      const next = Math.floor(Math.random() * KAOMOJI_POOL.length);
      setCenterKao(KAOMOJI_POOL[next]!);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {cells.map((cell, i) => (
          <KaomojiCell
            key={i}
            kaomoji={i === centerIdx ? centerKao : cell.kaomoji}
            bg={cell.bg}
            selected={i === centerIdx}
            onClick={() => {
              setCenterIdx(i);
              setCenterKao(cell.kaomoji);
            }}
          />
        ))}
      </div>
      <p className={styles.label}>LIVE PREVIEW · コレクション</p>
    </div>
  );
}
