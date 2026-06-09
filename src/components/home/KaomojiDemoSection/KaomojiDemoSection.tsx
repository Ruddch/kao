import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  buildRolePalette,
  loadGlyphData,
  type GlyphLookup,
  type GlyphPack,
  type PaletteCategory,
} from '../../../lib/glyphs';
import { Card } from '../../ui/Card';
import { SectionHead } from '../../ui/SectionHead';
import {
  KaomojiDemoEditor,
  type KaomojiDemoEditorHandle,
} from '../KaomojiDemoEditor';
import { RoleSymbolPalette } from '../RoleSymbolPalette';
import styles from './KaomojiDemoSection.module.css';

const E = [0.4, 0, 0.2, 1] as [number, number, number, number];
const IN_VIEW = { once: true, amount: 0.12 };

const fadeLeft = {
  hidden: { opacity: 0, x: -32 },
  show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: E } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: E } },
};

export function KaomojiDemoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const editorRef = useRef<KaomojiDemoEditorHandle>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pack, setPack] = useState<GlyphPack | null>(null);
  const [lookup, setLookup] = useState<GlyphLookup | null>(null);
  const [palette, setPalette] = useState<PaletteCategory[]>([]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad || pack) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    loadGlyphData()
      .then(({ pack: loadedPack, lookup: loadedLookup, roleCategories }) => {
        if (cancelled) return;
        setPack(loadedPack);
        setLookup(loadedLookup);
        setPalette(buildRolePalette(roleCategories, loadedPack));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load editor data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shouldLoad, pack]);

  const handleSymbolPick = (symbol: string) => {
    editorRef.current?.insertAtCaret(symbol);
  };

  return (
    <section id="editor" ref={sectionRef} className={styles.section}>
      <motion.div variants={fadeLeft} initial="hidden" whileInView="show" viewport={IN_VIEW}>
        <SectionHead title="Try the Editor" subtitle="CLICK · TYPE · CUSTOMIZE" />
      </motion.div>

      <motion.div
        className={styles.demo}
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={IN_VIEW}
      >
        <Card variant="feat" className={styles.editorCard}>
          {loading && (
            <div className={styles.loading}>
              <span className={styles.loadingText}>Loading glyphs…</span>
            </div>
          )}
          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}
          {pack && lookup && !error && (
            <KaomojiDemoEditor ref={editorRef} pack={pack} lookup={lookup} />
          )}
        </Card>

        <Card variant="feat" className={styles.paletteCard}>
          {palette.length > 0 ? (
            <RoleSymbolPalette categories={palette} onSymbolPick={handleSymbolPick} />
          ) : (
            <div className={styles.palettePlaceholder}>
              <span className={styles.loadingText}>
                {loading ? 'Loading symbols…' : 'Scroll to load palette'}
              </span>
            </div>
          )}
        </Card>
      </motion.div>

    </section>
  );
}
