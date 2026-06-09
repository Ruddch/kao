import { COLLECTION } from '../../../config/external';
import { Button } from '../../ui/Button';
import { HeroKaomoji } from '../HeroKaomoji';
import styles from './HeroBanner.module.css';

function scrollToMechanics() {
  document.getElementById('mechanics')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function HeroBanner() {
  return (
    <section className={styles.banner} aria-label="Kaomoji collection hero">
      <div className={styles.bgSpeed} aria-hidden="true" />
      <div className={styles.bgGrid} aria-hidden="true" />

      {/* <div className={styles.decoRow} aria-hidden="true">
        {DECO_KAO.map(({ kao, bg }, i) => (
          <span key={i} className={`${styles.decoKao} ${styles[`decoBg${bg}`]}`}>
            {kao}
          </span>
        ))}
      </div> */}

      <div className={styles.content}>
        <div className={styles.copyBlock}>
          {/* <span className={styles.stickerChain}>ON-CHAIN</span> */}

          <div className={styles.brandRow}>
            <p className={styles.brandMark}>{COLLECTION.nameJa}</p>
            <span className={styles.badgeWl}>KAOMOJI</span>
          </div>

          {/* <p className={styles.kicker}>ON-CHAIN DIGITAL COMPANION</p> */}

          <h1 className={styles.sloganMain}>
            The face that <em>knows</em> you.
          </h1>

          {/* <p className={styles.sloganSub}>
            Your Kaomoji is not a JPEG — it's a personalized digital companion that grows with you.
            Burn NFTs to earn modification points, shape your character, and unlock new stages.
          </p> */}

          <div className={styles.ctas}>
            <Button onClick={scrollToMechanics}>Sculpt your Kaomoji</Button>
          </div>
        </div>

        <div className={styles.previewCol}>
          <HeroKaomoji />
        </div>
      </div>

      <div className={styles.edgeBand} aria-hidden="true" />
    </section>
  );
}
