import styles from './ThemePicker.module.css';

export interface OnchainTheme {
  id: number;
  name: string;
  hex: string;
}

interface ThemePickerProps {
  themes: OnchainTheme[];
  value: number;
  onChange: (themeId: number) => void;
}

export function ThemePicker({ themes, value, onChange }: ThemePickerProps) {
  return (
    <div className={styles.root}>
      {themes.map((theme) => (
        <button
          key={theme.id}
          type="button"
          className={[styles.swatch, value === theme.id && styles.swatchActive]
            .filter(Boolean)
            .join(' ')}
          style={{ background: theme.hex }}
          title={theme.name}
          aria-label={theme.name}
          aria-pressed={value === theme.id}
          onClick={() => onChange(theme.id)}
        />
      ))}
    </div>
  );
}
