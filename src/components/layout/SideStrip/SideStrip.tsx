import styles from './SideStrip.module.css';

interface SideStripProps {
  side: 'left' | 'right';
}

export function SideStrip({ side }: SideStripProps) {
  if (side === 'left') {
    return (
      <aside className={styles.campaignStrip} aria-hidden="true">
        <div className={styles.stripEdge} />
        <div className={styles.stripCore} />
        <div className={styles.stripRail} />
      </aside>
    );
  }

  return (
    <aside className={styles.railTate} aria-hidden="true">
      <span className="tate">顔文字制作所 Kaomoji</span>
    </aside>
  );
}
