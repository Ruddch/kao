import styles from './SectionHead.module.css';

interface SectionHeadProps {
  title: string;
  subtitle?: string;
}

export function SectionHead({ title, subtitle }: SectionHeadProps) {
  return (
    <div className={styles.head}>
      <h2 className={styles.title}>{title}</h2>
      {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
    </div>
  );
}
