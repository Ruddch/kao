import { Link } from 'react-router-dom';
import { COLLECTION, EXTERNAL_LINKS } from '../../../config/external';
import styles from './Footer.module.css';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/studio', label: 'Studio' },
  { to: '/docs', label: 'Docs' },
];

const SOCIAL = [
  { href: EXTERNAL_LINKS.twitter, label: 'X' },
  { href: EXTERNAL_LINKS.discord, label: 'Discord' },
  { href: EXTERNAL_LINKS.opensea, label: 'OpenSea' },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.edgeBand} aria-hidden="true">
        <span className={`kao ${styles.edgeKao}`}>(◕‿◕)</span>
        <span className={`kao ${styles.edgeKao}`}>＼(^o^)／</span>
        <span className={`kao ${styles.edgeKao}`}>(♥ω♥*)</span>
        <span className={`kao ${styles.edgeKao}`}>(・∀・)</span>
        <span className={`kao ${styles.edgeKao}`}>ヽ(´▽`)/</span>
        <span className={`kao ${styles.edgeKao}`}>(╥﹏╥)</span>
        <span className={`kao ${styles.edgeKao}`}>(ﾉ◕ヮ◕)ﾉ</span>
        <span className={`kao ${styles.edgeKao}`}>(°ロ°)</span>
      </div>

      <div className={styles.bar}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandJa}>{COLLECTION.nameJa}</span>
          <span className={styles.brandEn}>{COLLECTION.name}</span>
        </Link>

        <nav className={styles.nav} aria-label="Footer navigation">
          {NAV.map(({ to, label }, i) => (
            <span key={to} className={styles.navItem}>
              {i > 0 && <span className={styles.sep} aria-hidden="true">·</span>}
              <Link to={to}>{label}</Link>
            </span>
          ))}
        </nav>

        <div className={styles.social}>
          {SOCIAL.map(({ href, label }, i) => (
            <span key={href} className={styles.navItem}>
              {i > 0 && <span className={styles.sep} aria-hidden="true">·</span>}
              <a href={href} target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            </span>
          ))}
        </div>

        <p className={styles.meta}>
          {COLLECTION.chainName} ⟠ · © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
