import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { COLLECTION, EXTERNAL_LINKS } from '../../config/external';
import { HeroBanner } from '../../components/home/HeroBanner';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SectionHead } from '../../components/ui/SectionHead';
import styles from './HomePage.module.css';

const MECHANICS = [
  {
    num: '01',
    title: 'Burn for Points',
    kao: '(╯°□°）╯',
    desc: 'Sacrifice an NFT to earn modification points. Irreversible — each burn fuels personalization and deflates the supply.',
    bg: 'yellow' as const,
  },
  {
    num: '02',
    title: 'Spend & Customize',
    kao: 'ლ(´ڡ`ლ)',
    desc: 'Use your points to change colors and traits. Shape a Kaomoji that reflects you — not a template everyone shares.',
    bg: 'cyan' as const,
  },
  {
    num: '03',
    title: 'Collective Unlocks',
    kao: '٩(◕‿◕)۶',
    desc: 'Every burn advances the whole ecosystem. Global milestones open personalization, AI companion, and physical device stages.',
    bg: 'pink' as const,
  },
];

const PHILOSOPHY = [
  {
    num: '01',
    title: 'Digital Pet',
    desc: 'A next-gen companion — like Tamagotchi, but on-chain. Interact daily and watch your character grow more useful over time.',
  },
  {
    num: '02',
    title: 'Deflationary Growth',
    desc: 'Not another JPEG collection. Each burned Kaomoji brings new capabilities closer for every holder in the ecosystem.',
  },
  {
    num: '03',
    title: 'Beyond the Wallet',
    desc: 'Collectible NFT, AI assistant, physical device — one character across three worlds. Your digital companion that grows with you.',
  },
];

const ROADMAP = [
  { stage: '00', label: 'Waitlist', kao: '( ˘▽˘)っ', live: true, color: 'yellow' as const },
  { stage: '01', label: 'Mint', kao: '(๑•̀ㅂ•́)و✧', color: 'cyan' as const },
  { stage: '02', label: 'Personalization', kao: '(✿╹◡╹)ﾉ', color: 'pink' as const },
  { stage: '03', label: 'AI Companion', kao: '(｀・ω・´)', color: 'blue' as const },
  { stage: '04', label: 'Physical Device', kao: '(ﾉ≧∀≦)ﾉ', color: 'green' as const },
];

// ─── Animation variants ───────────────────────────────────────────────────

const E = [0.4, 0, 0.2, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.5, ease: E } },
};

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

      <motion.div
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
      </motion.div>

      <section>
        <motion.div variants={fadeLeft} initial="hidden" whileInView="show" viewport={IN_VIEW}>
          <SectionHead title="Mechanics" subtitle="BURN · EARN · MODIFY" />
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
              <Card variant="feat" className={styles[`feat${m.bg}`]}>
                <div className={styles.featNum}>{m.num}</div>
                <span className={`kao ${styles.featKao}`}>{m.kao}</span>
                <h3 className={styles.featTitle}>{m.title}</h3>
                <p className={styles.featDesc}>{m.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section>
        <motion.div variants={fadeLeft} initial="hidden" whileInView="show" viewport={IN_VIEW}>
          <SectionHead title="Philosophy" subtitle="DIGITAL COMPANION · NOT A JPEG" />
        </motion.div>
        <motion.div
          className={styles.philosophy}
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={IN_VIEW}
        >
          {PHILOSOPHY.map((p) => (
            <motion.div key={p.num} variants={cardVariant}>
              <Card variant="feat">
                <div className={styles.featNum}>{p.num}</div>
                <h3 className={styles.featTitle}>{p.title}</h3>
                <p className={styles.featDesc}>{p.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

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
              className={`${styles.timeItem} ${styles[`timeColor${r.color}`]} ${r.live ? styles.timeItemLive : ''}`}
            >
              <div className={styles.timeAccent} aria-hidden="true" />
              <span className={styles.timeStage}>{r.stage}</span>
              <span className={`kao ${styles.timeKao}`}>{r.kao}</span>
              <span className={styles.timeLabel}>{r.label}</span>
              {r.live ? <Badge variant="live" blink /> : <Badge variant="tba" />}
              {i < ROADMAP.length - 1 && (
                <span className={styles.timeArrow} aria-hidden="true">→</span>
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      <motion.section
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
      </motion.section>

      <div className={`${styles.edgeBand} ${styles.bottom}`} aria-hidden="true" />
    </div>
  );
}
