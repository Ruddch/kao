import { NavLink, Outlet } from 'react-router-dom';
import styles from './DocsLayout.module.css';

const DOCS_NAV = [
  { to: '/docs', label: 'Getting Started', end: true },
  { to: '/docs/guides', label: 'User Guides' },
  { to: '/docs/contracts', label: 'Smart Contracts' },
  { to: '/docs/mechanics', label: 'Collection Mechanics' },
  { to: '/docs/faq', label: 'FAQ' },
];

export function DocsLayout() {
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <p className={styles.sidebarTitle}>Documentation</p>
        <nav className={styles.nav}>
          {DOCS_NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [styles.navLink, isActive && styles.navActive].filter(Boolean).join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
