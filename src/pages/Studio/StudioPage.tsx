import { useRef, useState } from 'react';
import {
  clampKaomoji,
  getRandomTemplate,
  getTemplateById,
} from '../../data/mock/kaomojiEditor';
import { getRandomBgColor, type StudioBgColor } from '../../data/mock/studioColors';
import {
  KaomojiInlineEditor,
  type KaomojiInlineEditorHandle,
} from '../../components/studio/KaomojiInlineEditor';
import { BgColorPicker } from '../../components/studio/BgColorPicker';
import { SymbolPalette } from '../../components/studio/SymbolPalette';
import { TemplatePicker } from '../../components/studio/TemplatePicker';
import { StudioToolSection } from '../../components/studio/StudioToolSection';
import styles from './StudioPage.module.css';

export function StudioPage() {
  const randomBoot = useState(getRandomTemplate)[0];
  const randomBg = useState(getRandomBgColor)[0];
  const editorRef = useRef<KaomojiInlineEditorHandle>(null);
  const [toolsOpen, setToolsOpen] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState(randomBoot.id);
  const [text, setText] = useState(randomBoot.label);
  const [bgColor, setBgColor] = useState<StudioBgColor>(randomBg);

  const handleTemplateSelect = (templateId: string) => {
    const tpl = getTemplateById(templateId);
    if (!tpl) return;
    setSelectedTemplateId(templateId);
    setText(clampKaomoji(tpl.label));
    requestAnimationFrame(() => editorRef.current?.focus());
  };

  const handleSymbolPick = (symbol: string) => {
    editorRef.current?.insertAtCaret(symbol);
  };

  return (
    <div className={[styles.editor, !toolsOpen && styles.editorToolsCollapsed].filter(Boolean).join(' ')}>
      <section className={styles.main}>
        <div className={styles.mainHead}>
          <h1 className={styles.title}>Kaomoji Studio</h1>
          <p className={styles.subtitle}>Demo editor · click the face to type</p>
        </div>

        <div className={styles.editorStage}>
          <KaomojiInlineEditor
            ref={editorRef}
            value={text}
            onChange={setText}
            bg={bgColor}
          />
        </div>
      </section>

      <div className={styles.toolsColumn}>
        <button
          type="button"
          className={styles.toolsToggle}
          onClick={() => setToolsOpen((open) => !open)}
          aria-expanded={toolsOpen}
          aria-controls="studio-tools-panel"
        >
          <span className={styles.toolsToggleIcon} aria-hidden="true">
            {toolsOpen ? '›' : '‹'}
          </span>
          <span className={styles.toolsToggleLabel}>Tools</span>
        </button>

        <aside id="studio-tools-panel" className={styles.actions}>
          <div className={styles.modifyPanel}>
            <StudioToolSection title="Start frame" defaultOpen>
              <TemplatePicker
                selectedTemplateId={selectedTemplateId}
                onSelect={handleTemplateSelect}
              />
            </StudioToolSection>
            <StudioToolSection title="Background" defaultOpen>
              <BgColorPicker value={bgColor} onChange={setBgColor} />
            </StudioToolSection>
            <StudioToolSection title="Insert at caret" defaultOpen>
              <SymbolPalette onSymbolPick={handleSymbolPick} />
            </StudioToolSection>
          </div>
        </aside>
      </div>
    </div>
  );
}
