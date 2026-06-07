import { useEffect, useState } from 'react';
import { KAOMOJI_POOL } from '../../../data/mock/nfts';
import styles from './HeroKaomoji.module.css';

const DEFAULT_KAO = '(๑•̀ㅂ•́)و✧';

export function HeroKaomoji() {
  const [kao, setKao] = useState(DEFAULT_KAO);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = KAOMOJI_POOL[Math.floor(Math.random() * KAOMOJI_POOL.length)]!;
      setKao(next);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.wrap}>
      <div className={styles.plate} aria-hidden="true" />
      <p className={`kao ${styles.kao}`}>{kao}</p>
      <span className={styles.stickerOfficial}>公式カオモジ</span>
      <span className={styles.stickerFree}>デジタルペット</span>
    </div>
  );
}
