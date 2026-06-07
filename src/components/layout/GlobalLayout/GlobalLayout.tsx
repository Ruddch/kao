import { Outlet, useLocation } from 'react-router-dom';
import { homeMarqueeConfig, studioMarqueeConfig } from '../../../config/marquee';
import { Footer } from '../Footer';
import { Header } from '../Header';
import { MarqueeStrip } from '../MarqueeStrip';
import { SideStrip } from '../SideStrip';
import styles from './GlobalLayout.module.css';

export function GlobalLayout() {
  const { pathname } = useLocation();
  const marqueeConfig =
    pathname === '/' ? homeMarqueeConfig :
    pathname === '/studio' ? studioMarqueeConfig :
    { ...homeMarqueeConfig, enabled: false };

  return (
    <div className={styles.layout}>
      <MarqueeStrip config={marqueeConfig} />
      <Header />
      <div className={styles.frame}>
        <SideStrip side="left" />
        <main className={styles.main}>
          <Outlet />
        </main>
        <SideStrip side="right" />
      </div>
      <Footer />
    </div>
  );
}
