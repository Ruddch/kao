import { useEffect, useRef, useState } from 'react';
import { KAOMOJI_POOL } from '../../../data/mock/nfts';
import styles from './HeroKaomoji.module.css';

const SWAP_INTERVAL = 3200;
const EXIT_DURATION = 520;

interface Layer {
  id: number;
  kao: string;
}

export function HeroKaomoji() {
  const [layers, setLayers] = useState<Layer[]>([{ id: 0, kao: KAOMOJI_POOL[0]! }]);
  const idRef = useRef(0);
  const indexRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % KAOMOJI_POOL.length;
      const next = KAOMOJI_POOL[indexRef.current]!;
      idRef.current += 1;
      const id = idRef.current;

      // Keep the previous layer alongside the new one so they cross-fade.
      setLayers((prev) => [...prev.slice(-1), { id, kao: next }]);

      // Drop the old layer once its exit animation has finished.
      window.setTimeout(() => {
        setLayers((prev) => prev.filter((layer) => layer.id === id));
      }, EXIT_DURATION);
    }, SWAP_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.wrap}>
      <div className={styles.plate} aria-hidden="true" />
      <div className={styles.kaoStack}>
        {layers.map((layer, i) => {
          const isCurrent = i === layers.length - 1;
          return (
            <p
              key={layer.id}
              className={`kao ${styles.kao} ${isCurrent ? styles.kaoEnter : styles.kaoExit}`}
              aria-hidden={!isCurrent}
            >
              {layer.kao}
            </p>
          );
        })}
      </div>
      <span className={styles.stickerOfficial}>公式カオモジ</span>
      <span className={styles.stickerFree}>デジタルペット</span>
    </div>
  );
}
