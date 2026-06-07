import { KAOMOJI_TEMPLATES } from '../../../data/mock/kaomojiEditor';
import styles from './TemplatePicker.module.css';

interface TemplatePickerProps {
  selectedTemplateId: string;
  onSelect: (templateId: string) => void;
}

export function TemplatePicker({ selectedTemplateId, onSelect }: TemplatePickerProps) {
  return (
    <div className={styles.root}>
      <div className={styles.grid}>
        {KAOMOJI_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            className={[
              styles.templateBtn,
              selectedTemplateId === tpl.id && styles.templateSelected,
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onSelect(tpl.id)}
            title={tpl.label}
          >
            <span className={`kao ${styles.templateKao}`}>{tpl.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
