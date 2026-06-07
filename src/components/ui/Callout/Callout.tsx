import type { ReactNode } from 'react';
import styles from './Callout.module.css';

type Variant = 'tip' | 'warning' | 'danger';

interface CalloutProps {
  variant?: Variant;
  title?: string;
  children: ReactNode;
}

export function Callout({ variant = 'tip', title, children }: CalloutProps) {
  return (
    <div className={[styles.callout, styles[variant]].join(' ')}>
      {title && <strong className={styles.title}>{title}</strong>}
      <div>{children}</div>
    </div>
  );
}
