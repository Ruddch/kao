import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

type Variant = 'default' | 'sticker' | 'nftCell' | 'feat';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  children: ReactNode;
  hot?: boolean;
}

export function Card({ variant = 'default', hot, children, className, ...props }: CardProps) {
  return (
    <div
      className={[
        styles.card,
        styles[variant],
        hot && styles.hot,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
