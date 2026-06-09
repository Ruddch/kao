import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { EXTERNAL_LINKS } from '../../../config/external';
import { Badge } from '../../ui/Badge';
import { Chip } from '../../ui/Chip';
import { SocialIconLink } from '../../ui/SocialIconLink';
import { WalletButton } from '../../ui/WalletButton';
import styles from './Header.module.css';

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
};

const NAV: NavItem[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/checker', label: 'Checker' },
  { to: '/docs', label: 'Docs', disabled: true, comingSoon: true },
];

const SOCIAL = [
  { platform: 'twitter' as const, href: EXTERNAL_LINKS.twitter },
  { platform: 'discord' as const, href: EXTERNAL_LINKS.discord, disabled: true },
  { platform: 'opensea' as const, href: EXTERNAL_LINKS.opensea, disabled: true },
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
            {NAV.map(({ to, label, end, disabled, comingSoon }) =>
              disabled ? (
                <Chip key={to} as="span" variant="nav" className={styles.chipDisabled}>
                  <span className={styles.chipLabel}>{label}</span>
                  {comingSoon && (
                    <span className={styles.stickerBadge}>
                      <Badge variant="soon" />
                    </span>
                  )}
                </Chip>
              ) : (
                <NavLink key={to} to={to} end={end}>
                  {({ isActive }) => (
                    <Chip as="span" variant="nav" active={isActive}>
                      {label}
                    </Chip>
                  )}
                </NavLink>
              ),
            )}
          </nav>

          <span className={styles.divider} aria-hidden="true" />

          <div className={styles.social} aria-label="Social links">
            {SOCIAL.map(({ platform, href, disabled }) => (
              <SocialIconLink key={platform} platform={platform} href={href} disabled={disabled} />
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
            {NAV.map(({ to, label, end, disabled, comingSoon }) =>
              disabled ? (
                <Chip key={to} as="span" variant="nav" className={styles.chipDisabled}>
                  <span className={styles.chipLabel}>{label}</span>
                  {comingSoon && (
                    <span className={styles.stickerBadge}>
                      <Badge variant="soon" />
                    </span>
                  )}
                </Chip>
              ) : (
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
              ),
            )}
          </nav>

          <span className={styles.mobileDivider} aria-hidden="true" />

          <div className={styles.mobileSocial} aria-label="Social links">
            {SOCIAL.map(({ platform, href, disabled }) => (
              <SocialIconLink key={platform} platform={platform} href={href} disabled={disabled} />
            ))}
          </div>

          <WalletButton />
        </div>
      )}
    </header>
  );
}
