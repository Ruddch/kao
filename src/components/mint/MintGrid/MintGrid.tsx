import { useEffect, useRef } from 'react';
import { setKaomojiTextContent } from '../../../lib/glyphs/kaoCharFont';
import { KAOMOJI_POOL } from '../../../data/mock/nfts';
import styles from './MintGrid.module.css';

const COLS = 5;
const ROWS = 5;
const GRID_SIZE = COLS * ROWS;
const CX = Math.floor(COLS / 2); // 2
const CY = Math.floor(ROWS / 2); // 2

// Manhattan distance — determines activation order
const manhDist = (col: number, row: number) => Math.abs(col - CX) + Math.abs(row - CY);
const MAX_DIST = Math.max(...Array.from({ length: GRID_SIZE }, (_, i) => manhDist(i % COLS, Math.floor(i / COLS))));

const SWAP_MS  = 900;
const SLIDE_MS = Math.round(SWAP_MS * 0.55);
const BASE_FONT = 18;
const EASING   = 'cubic-bezier(0.4, 0, 0.2, 1)';

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i]!, a[j]!] = [a[j]!, a[i]!];
  }
  return a;
}

function pickNot(pool: string[], avoid: string): string {
  if (pool.length <= 1) return pool[0]!;
  let v = pool[Math.floor(Math.random() * pool.length)]!;
  for (let n = 0; n < 8 && v === avoid; n++) v = pool[Math.floor(Math.random() * pool.length)]!;
  return v;
}

function makeLayer(kao: string, lCls: string, tCls: string): HTMLDivElement {
  const d = document.createElement('div');
  d.className = lCls;
  const s = document.createElement('span');
  s.className = tCls;
  setKaomojiTextContent(s, kao);
  d.appendChild(s);
  return d;
}

function fitText(layer: HTMLElement, inner: HTMLElement) {
  const t = layer.firstElementChild as HTMLElement | null;
  if (!t) return;
  t.style.fontSize = `${BASE_FONT}px`;
  const w = inner.clientWidth, h = inner.clientHeight;
  if (w < 1 || h < 1 || (t.scrollWidth <= w && t.scrollHeight <= h)) return;
  let lo = 9, hi = BASE_FONT - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    t.style.fontSize = `${mid}px`;
    if (t.scrollWidth <= w && t.scrollHeight <= h) lo = mid; else hi = mid - 1;
  }
  t.style.fontSize = `${lo}px`;
}

interface Cell {
  inner: HTMLDivElement;
  layer: HTMLDivElement;
  kao:   string;
  dist:  number;       // Manhattan distance from center
  timer?: ReturnType<typeof setTimeout>;
}

export function MintGrid() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const grid = gridRef.current;
    if (!wrap || !grid) return;

    grid.innerHTML = '';

    const cs   = getComputedStyle(wrap);
    const CELL = parseFloat(cs.getPropertyValue('--mg-cell'));
    const GAP  = parseFloat(cs.getPropertyValue('--mg-gap'));
    if (!CELL || !GAP) return;

    const GRID_W = COLS * CELL + (COLS - 1) * GAP;
    const GRID_H = ROWS * CELL + (ROWS - 1) * GAP;

    function applyCamera() {
      const s  = Math.min(wrap!.clientWidth / GRID_W, wrap!.clientHeight / GRID_H);
      const tx = Math.round(wrap!.clientWidth  / 2 - GRID_W / 2 * s);
      const ty = Math.round(wrap!.clientHeight / 2 - GRID_H / 2 * s);
      grid!.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${s})`;
    }

    // ── Build grid ────────────────────────────────────────────────────
    const cells: Cell[] = [];
    const pool = shuffle(
      KAOMOJI_POOL.length >= GRID_SIZE ? KAOMOJI_POOL : [...KAOMOJI_POOL, ...KAOMOJI_POOL],
    ).slice(0, GRID_SIZE);

    const frag = document.createDocumentFragment();
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const dist = manhDist(col, row);
        const el   = document.createElement('div');
        el.className = styles.cell + (dist === 0 ? ` ${styles.cellCenter}` : '');
        const inner = document.createElement('div');
        inner.className = styles.cellInner;
        const kao = pool[row * COLS + col]!;
        const layer = makeLayer(kao, styles.kaoLayer, styles.kaoText);
        inner.appendChild(layer);
        el.appendChild(inner);
        cells.push({ inner, layer, kao, dist });
        frag.appendChild(el);
      }
    }
    grid.appendChild(frag);

    // ── Camera + fit after fonts ──────────────────────────────────────
    document.fonts.ready.then(() => {
      applyCamera();
      cells.forEach(({ layer }) => { (layer.firstElementChild as HTMLElement).style.fontSize = `${BASE_FONT}px`; });
      cells.forEach(({ layer, inner }) => fitText(layer, inner));
    });

    const ro = new ResizeObserver(() => applyCamera());
    ro.observe(wrap);

    // ── Swap a single cell (slide up) ─────────────────────────────────
    function swapCell(cell: Cell) {
      const kao  = pickNot(KAOMOJI_POOL, cell.kao);
      const prev = cell.layer;
      const next = makeLayer(kao, styles.kaoLayer, styles.kaoText);

      if (cell.timer) { clearTimeout(cell.timer); cell.timer = undefined; }
      Array.from(cell.inner.children).forEach((n) => { if (n !== prev) n.remove(); });

      prev.style.cssText += ';transition:none;transform:translateY(0)';
      next.style.cssText  = 'transition:none;transform:translateY(110%)';
      cell.inner.appendChild(next);
      fitText(next, cell.inner);

      requestAnimationFrame(() => requestAnimationFrame(() => {
        prev.style.transition = `transform ${SLIDE_MS}ms ${EASING}`;
        prev.style.transform  = 'translateY(-110%)';
        next.style.transition = `transform ${SLIDE_MS}ms ${EASING}`;
        next.style.transform  = 'translateY(0)';
      }));

      cell.timer = setTimeout(() => {
        prev.remove();
        next.style.transition = 'none';
        cell.timer = undefined;
      }, SLIDE_MS + 40);

      cell.layer = next;
      cell.kao   = kao;
    }

    // ── Main loop: every tick expand active radius + swap all active ──
    // activeDist starts at 0 (center only) and grows up to MAX_DIST,
    // then stays there — all cells active forever.
    let activeDist = 0;

    const iv = setInterval(() => {
      // Swap every cell within the current active radius
      cells.forEach((cell) => {
        if (cell.dist <= activeDist) swapCell(cell);
      });
      // Expand wave; restart from center once fully spread
      activeDist = activeDist < MAX_DIST ? activeDist + 1 : 0;
    }, SWAP_MS);

    return () => {
      ro.disconnect();
      clearInterval(iv);
      cells.forEach((c) => { if (c.timer) clearTimeout(c.timer); });
      grid.innerHTML = '';
    };
  }, []);

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <div ref={gridRef} className={styles.grid} />
      <div className={styles.overlay}>
        <span className={styles.overlayLabel}>KAOMOJI NFT</span>
      </div>
    </div>
  );
}
