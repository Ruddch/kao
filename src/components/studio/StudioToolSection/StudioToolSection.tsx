import { useId, useState, type ReactNode } from 'react';
import styles from './StudioToolSection.module.css';

interface StudioToolSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function StudioToolSection({ title, defaultOpen = true, children }: StudioToolSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <section className={styles.section}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={bodyId}
      >
        <span className={styles.title}>{title}</span>
        <span
          className={[styles.caret, open && styles.caretOpen].filter(Boolean).join(' ')}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div id={bodyId} className={styles.body}>
          {children}
        </div>
      )}
    </section>
  );
}
