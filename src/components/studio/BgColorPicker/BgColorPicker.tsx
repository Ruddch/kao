import {
  PLATE_CONTRAST,
  STUDIO_BG_OPTIONS,
  capitalizeColorId,
  type StudioBgColor,
} from '../../../data/mock/studioColors';
import colorStyles from '../studioColors.module.css';
import styles from './BgColorPicker.module.css';

interface BgColorPickerProps {
  value: StudioBgColor;
  onChange: (color: StudioBgColor) => void;
}

export function BgColorPicker({ value, onChange }: BgColorPickerProps) {
  return (
    <div className={styles.root}>
      <div className={styles.grid}>
        {STUDIO_BG_OPTIONS.map((opt) => {
          const plate = PLATE_CONTRAST[opt.id];
          const cap = capitalizeColorId(opt.id);
          const plateCap = capitalizeColorId(plate);

          return (
            <button
              key={opt.id}
              type="button"
              className={[
                styles.swatch,
                colorStyles[`bg${cap}`],
                value === opt.id && styles.swatchSelected,
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onChange(opt.id)}
              title={`${opt.label} · plate ${plate}`}
              aria-label={opt.label}
              aria-pressed={value === opt.id}
            >
              <span
                className={[styles.plateDot, colorStyles[`plate${plateCap}`]].join(' ')}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
