import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { COLLECTION, EXTERNAL_LINKS } from '../../../config/external';
import { HeroKaomoji } from '../HeroKaomoji';
import { Button } from '../../ui/Button';
import styles from './HeroBanner.module.css';

const DECO_KAO = [
  { kao: '(ﾉ◕ヮ◕)ﾉ*:･✧', bg: 'w' as const },
  { kao: 'ヽ(´▽`)/', bg: 'c' as const },
  { kao: '(♥ω♥*)', bg: 'r' as const },
  { kao: '(≧∇≦)', bg: 'p' as const },
  { kao: '٩(◕‿◕)۶', bg: 'g' as const },
];

export function HeroBanner() {
  const { isConnected } = useAccount();

  return (
    <section className={styles.banner} aria-label="Kaomoji collection hero">
      <div className={styles.bgSpeed} aria-hidden="true" />
      <div className={styles.bgGrid} aria-hidden="true" />

      <div className={styles.decoRow} aria-hidden="true">
        {DECO_KAO.map(({ kao, bg }, i) => (
          <span key={i} className={`${styles.decoKao} ${styles[`decoBg${bg}`]}`}>
            {kao}
          </span>
        ))}
      </div>

      <div className={styles.content}>
        <div className={styles.copyBlock}>
          <span className={styles.stickerChain}>ON-CHAIN</span>

          <div className={styles.brandRow}>
            <p className={styles.brandMark}>{COLLECTION.nameJa}</p>
            <span className={styles.badgeWl}>NFT</span>
          </div>

          <p className={styles.kicker}>ON-CHAIN DIGITAL COMPANION</p>

          <h1 className={styles.sloganMain}>
            The face that <em>knows</em> you.
          </h1>

          <p className={styles.sloganSub}>
            Your Kaomoji is not a JPEG — it's a personalized digital companion that grows with you.
            Burn NFTs to earn modification points, shape your character, and unlock new stages.
          </p>

          <div className={styles.ctas}>
            {isConnected ? (
              <Link to="/studio">
                <Button>Enter Studio →</Button>
              </Link>
            ) : (
              <ConnectKitButton.Custom>
                {({ show }) => <Button onClick={show}>Connect Wallet</Button>}
              </ConnectKitButton.Custom>
            )}
            <a href={EXTERNAL_LINKS.opensea} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary">Browse on OpenSea ↗</Button>
            </a>
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
