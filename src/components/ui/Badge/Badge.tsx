import styles from './Badge.module.css';

type Variant = 'new' | 'onchain' | 'evolvable' | 'limited' | 'soon' | 'live' | 'tba' | 'eligible' | 'notEligible';

interface BadgeProps {
  variant?: Variant;
  children?: React.ReactNode;
  blink?: boolean;
  className?: string;
}

const LABELS: Record<Variant, string> = {
  new: 'NEW',
  onchain: 'ON-CHAIN',
  evolvable: 'EVOLVABLE',
  limited: 'LIMITED',
  soon: 'SOON',
  live: 'LIVE',
  tba: 'TBA',
  eligible: 'ELIGIBLE',
  notEligible: 'NOT ELIGIBLE',
};

export function Badge({ variant = 'new', children, blink, className }: BadgeProps) {
  if (variant === 'live') {
    return (
      <span className={[styles.badge, styles.live, className].filter(Boolean).join(' ')}>
        <span className={`${styles.liveDot} ${blink ? styles.blink : ''}`} aria-hidden="true">●</span>
        {' '}
        {children ?? LABELS[variant]}
      </span>
    );
  }

  return (
    <span className={[styles.badge, styles[variant], blink && styles.blink, className].filter(Boolean).join(' ')}>
      {children ?? LABELS[variant]}
    </span>
  );
}
