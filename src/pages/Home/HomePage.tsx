import { motion } from 'framer-motion';
import { HeroBanner } from '../../components/home/HeroBanner';
import { KaomojiDemoSection } from '../../components/home/KaomojiDemoSection';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { SectionHead } from '../../components/ui/SectionHead';
import styles from './HomePage.module.css';

const MECHANICS = [
  {
    num: '01',
    title: 'Burn for Ink',
    kao: '(╯°□°）╯',
    desc: 'Sacrifice an NFT to earn Ink. Ink is the currency of customization. Every burn is permanent and shrinks the supply.',
    bg: 'yellow' as const,
  },
  {
    num: '02',
    title: 'Edit & Expand',
    kao: 'ლ(´ڡ`ლ)',
    desc: 'Spend Ink to swap symbols in your Kaomoji or add new ones. Replace what you have or stretch the face in new directions.',
    bg: 'cyan' as const,
  },
  {
    num: '03',
    title: 'Rising Cost',
    kao: '٩(◕‿◕)۶',
    desc: 'Each new symbol costs more than the last. The fuller your Kaomoji grows, the more Ink the next addition demands.',
    bg: 'pink' as const,
  },
];

const ROADMAP = [
  { stage: '00', label: 'Waitlist', kao: '( ˘▽˘)っ', live: true, color: 'yellow' as const },
  { stage: '01', label: 'Mint', kao: '(๑•̀ㅂ•́)و✧', color: 'cyan' as const },
  { stage: '02', label: 'Personalization', kao: '(✿╹◡╹)ﾉ', color: 'pink' as const },
  { stage: '03', kao: '(｀・ω・´)', color: 'blue' as const, masked: true, tease: 'Nice try, sleuth.' },
  { stage: '04', kao: '(ﾉ≧∀≦)ﾉ', color: 'green' as const, masked: true, tease: 'Ha. Still sealed.' },
];

// ─── Animation variants ───────────────────────────────────────────────────

const E = [0.4, 0, 0.2, 1] as [number, number, number, number];

const fadeLeft = {
  hidden: { opacity: 0, x: -32 },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.45, ease: E } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.45, ease: E } },
};

const roadmapVariant = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.4, ease: E } },
};

const IN_VIEW = { once: true, amount: 0.12 };

export function HomePage() {
  return (
    <div className={styles.page}>
      <HeroBanner />

      {/* <motion.div
        className={styles.trustStrip}
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={IN_VIEW}
      >
        <span>✓ Verified Contract</span>
        <span>·</span>
        <span>{COLLECTION.totalSupply.toLocaleString()} Supply</span>
        <span>·</span>
        <span>2,847 Owners</span>
        <span>·</span>
        <a href={EXTERNAL_LINKS.etherscan} target="_blank" rel="noopener noreferrer">
          Etherscan ↗
        </a>
      </motion.div> */}

      <section id="mechanics" className={styles.mechanicsSection}>
        <motion.div variants={fadeLeft} initial="hidden" whileInView="show" viewport={IN_VIEW}>
          <SectionHead title="Mechanics" subtitle="BURN · INK · EXPAND" />
        </motion.div>
        <motion.div
          className={styles.mechanics}
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={IN_VIEW}
        >
          {MECHANICS.map((m) => (
            <motion.div key={m.num} variants={cardVariant}>
              <Card variant="feat" className={`${styles.featCard} ${styles[`feat${m.bg}`]}`}>
                <div className={styles.featHead}>
                  <span className={styles.featNum}>{m.num}</span>
                  <h3 className={styles.featTitle}>{m.title}</h3>
                </div>
                <p className={styles.featDesc}>{m.desc}</p>
                <span className={`kao ${styles.featKao}`} aria-hidden="true">{m.kao}</span>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <KaomojiDemoSection />

      <section>
        <motion.div variants={fadeLeft} initial="hidden" whileInView="show" viewport={IN_VIEW}>
          <SectionHead title="Roadmap" subtitle="ECOSYSTEM MILESTONES" />
        </motion.div>
        <motion.div
          className={styles.roadmap}
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.05 }}
        >
          {ROADMAP.map((r, i) => (
            <motion.div
              key={r.stage}
              variants={roadmapVariant}
              className={[
                styles.timeItem,
                styles[`timeColor${r.color}`],
                r.live ? styles.timeItemLive : '',
                r.masked ? styles.timeItemMasked : '',
              ].filter(Boolean).join(' ')}
            >
              <div className={styles.timeAccent} aria-hidden="true" />
              {r.masked ? (
                <>
                  <span className={styles.timeStage}>{r.stage}</span>
                  <span className={`kao ${styles.timeKao}`}>{r.kao}</span>
                  <span className={styles.timeMaskedLabel}>{r.tease}</span>
                  <span className={styles.timeMaskedBadge}>
                    <Badge variant="tba" />
                  </span>
                </>
              ) : (
                <>
                  <span className={styles.timeStage}>{r.stage}</span>
                  <span className={`kao ${styles.timeKao}`}>{r.kao}</span>
                  <span className={styles.timeLabel}>{r.label}</span>
                  {r.live ? <Badge variant="live" blink /> : <Badge variant="tba" />}
                </>
              )}
              {i < ROADMAP.length - 1 && (
                <span className={styles.timeArrow} aria-hidden="true">→</span>
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* <motion.section
        className={styles.ctaBand}
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={IN_VIEW}
      >
        <p className={styles.ctaText}>★ Burn to earn points. Customize in the Studio. ★</p>
        <Link to="/studio">
          <Button variant="secondary">Enter Studio →</Button>
        </Link>
      </motion.section> */}

      <div className={`${styles.edgeBand} ${styles.bottom}`} aria-hidden="true" />
    </div>
  );
}
