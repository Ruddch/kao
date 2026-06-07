import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { EXTERNAL_LINKS } from '../../../config/external';
import { Chip } from '../../ui/Chip';
import { SocialIconLink } from '../../ui/SocialIconLink';
import { WalletButton } from '../../ui/WalletButton';
import styles from './Header.module.css';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/mint', label: 'Mint' },
  { to: '/studio', label: 'Studio' },
  { to: '/docs', label: 'Docs' },
];

const SOCIAL = [
  { platform: 'twitter' as const, href: EXTERNAL_LINKS.twitter },
  { platform: 'discord' as const, href: EXTERNAL_LINKS.discord },
  { platform: 'opensea' as const, href: EXTERNAL_LINKS.opensea },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
          <span className={styles.logoJa}>カオモジ</span>
          <span className={styles.logoEn}>KAOMOJI</span>
        </NavLink>

        <div className={styles.menuCluster}>
          <nav className={styles.nav} aria-label="Main navigation">
            {NAV.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end}>
                {({ isActive }) => (
                  <Chip as="span" variant="nav" active={isActive}>
                    {label}
                  </Chip>
                )}
              </NavLink>
            ))}
          </nav>

          <span className={styles.divider} aria-hidden="true" />

          <div className={styles.social} aria-label="Social links">
            {SOCIAL.map(({ platform, href }) => (
              <SocialIconLink key={platform} platform={platform} href={href} />
            ))}
          </div>
        </div>

        <div className={styles.wallet}>
          <WalletButton />
        </div>

        <button
          type="button"
          className={styles.menuBtn}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          <nav className={styles.mobileNav} aria-label="Main navigation">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMenuOpen(false)}
              >
                {({ isActive }) => (
                  <Chip as="span" variant="nav" active={isActive}>
                    {label}
                  </Chip>
                )}
              </NavLink>
            ))}
          </nav>

          <span className={styles.mobileDivider} aria-hidden="true" />

          <div className={styles.mobileSocial} aria-label="Social links">
            {SOCIAL.map(({ platform, href }) => (
              <SocialIconLink key={platform} platform={platform} href={href} />
            ))}
          </div>

          <WalletButton />
        </div>
      )}
    </header>
  );
}
