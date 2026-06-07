import styles from './CodeBlock.module.css';

interface CodeBlockProps {
  children: string;
}

export function CodeBlock({ children }: CodeBlockProps) {
  return (
    <pre className={styles.pre}>
      <code className={styles.code}>{children}</code>
    </pre>
  );
}
