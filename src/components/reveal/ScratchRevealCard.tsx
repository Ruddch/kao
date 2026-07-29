import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import styles from './ScratchRevealCard.module.css';

export type ScratchPhase = 'locked' | 'preparing' | 'ready' | 'complete';

export interface ScratchRevealCardHandle {
  scratchFast: () => void;
}

interface ScratchRevealCardProps {
  imageSrc: string | null;
  tokenId: string;
  phase: ScratchPhase;
  onComplete?: () => void;
}

const AUTO_COMPLETE_THRESHOLD = 0.5;
const SAMPLE_STRIDE = 4;
/** Fixed coin-scrape angle (down-right). No random orientation on click. */
const SCRAPE_ANGLE = -Math.PI / 5;
const SECONDARY_OFFSET_RATIO = 0.28;

function drawFoil(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = false;

  const base = ctx.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, '#c8ccd4');
  base.addColorStop(0.18, '#f4f5f8');
  base.addColorStop(0.4, '#d5d8e0');
  base.addColorStop(0.62, '#ffffff');
  base.addColorStop(0.82, '#cfd3db');
  base.addColorStop(1, '#b4b8c2');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const sparkleCount = Math.floor((width * height) / 18);
  for (let i = 0; i < sparkleCount; i += 1) {
    const x = (Math.random() * width) | 0;
    const y = (Math.random() * height) | 0;
    const bright = Math.random() > 0.72;
    const shade = bright ? 235 + ((Math.random() * 20) | 0) : 170 + ((Math.random() * 50) | 0);
    ctx.fillStyle = `rgba(${shade},${shade + 1},${shade + 4},${bright ? 0.95 : 0.55})`;
    ctx.fillRect(x, y, bright ? 2 : 1, bright ? 2 : 1);
  }

  ctx.save();
  const step = Math.max(14, (width / 36) | 0);
  for (let i = -height; i < width + height; i += step) {
    ctx.globalAlpha = i / step % 3 === 0 ? 0.28 : 0.1;
    ctx.fillStyle = i / step % 3 === 0 ? '#ffffff' : '#9aa0aa';
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + step * 0.55, 0);
    ctx.lineTo(i - height + step * 0.55, height);
    ctx.lineTo(i - height, height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const shine = ctx.createRadialGradient(
    width * 0.35,
    height * 0.3,
    Math.min(width, height) * 0.05,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.7,
  );
  shine.addColorStop(0, 'rgba(255,255,255,0.45)');
  shine.addColorStop(0.45, 'rgba(255,255,255,0.08)');
  shine.addColorStop(1, 'rgba(120,124,134,0.18)');
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `700 ${Math.max(14, Math.floor(width * 0.04))}px ui-monospace, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SCRATCH', width / 2, height / 2);
}

/**
 * Coin-scrape brush: long rough streak (not a circle).
 * Alpha only — used with destination-out.
 */
function createCoinBrush(length: number, width: number): HTMLCanvasElement {
  const pad = 4;
  const w = Math.ceil(length + pad * 2);
  const h = Math.ceil(width + pad * 2);
  const brush = document.createElement('canvas');
  brush.width = w;
  brush.height = h;
  const b = brush.getContext('2d');
  if (!b) return brush;

  const cy = h / 2;

  // Core scrape body — tapered capsule with noisy sides
  b.fillStyle = '#000';
  b.beginPath();
  const segs = 24;
  for (let i = 0; i <= segs; i += 1) {
    const t = i / segs;
    const x = pad + t * length;
    const taper = Math.sin(t * Math.PI); // fat middle, thin ends
    const half = (width * 0.5 * taper) * (0.75 + Math.random() * 0.5);
    const y = cy - half;
    if (i === 0) b.moveTo(x, y);
    else b.lineTo(x, y);
  }
  for (let i = segs; i >= 0; i -= 1) {
    const t = i / segs;
    const x = pad + t * length;
    const taper = Math.sin(t * Math.PI);
    const half = (width * 0.5 * taper) * (0.75 + Math.random() * 0.5);
    b.lineTo(x, cy + half);
  }
  b.closePath();
  b.fill();

  // Peel flakes along the scrape
  b.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 22; i += 1) {
    const t = Math.random();
    const x = pad + t * length;
    const taper = Math.sin(t * Math.PI);
    const y = cy + (Math.random() - 0.5) * width * taper;
    b.beginPath();
    b.ellipse(x, y, 1 + Math.random() * 3, 0.8 + Math.random() * 2, Math.random(), 0, Math.PI * 2);
    b.fill();
  }

  // Extra crumb trail
  b.globalCompositeOperation = 'source-over';
  b.fillStyle = '#000';
  for (let i = 0; i < 30; i += 1) {
    const t = Math.random();
    const x = pad + t * length + (Math.random() - 0.5) * 4;
    const y = cy + (Math.random() - 0.5) * (width * 0.9);
    b.fillRect(x, y, 1 + Math.random() * 2, 1);
  }

  return brush;
}

export const ScratchRevealCard = forwardRef<ScratchRevealCardHandle, ScratchRevealCardProps>(
  function ScratchRevealCard({ imageSrc, tokenId, phase, onComplete }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const brushRef = useRef<HTMLCanvasElement | null>(null);
    const draggingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const autoRafRef = useRef<number | null>(null);
    const completeRef = useRef(false);
    const [clearedRatio, setClearedRatio] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    const canScratch = phase === 'ready' && !isComplete;
    // Keep foil mounted for locked/preparing even after a prior scratch session.
    const showCanvas =
      phase === 'locked' || phase === 'preparing' || (phase === 'ready' && !isComplete);

    const cancelAuto = useCallback(() => {
      if (autoRafRef.current !== null) {
        cancelAnimationFrame(autoRafRef.current);
        autoRafRef.current = null;
      }
    }, []);

    const resetScratchState = useCallback(() => {
      cancelAuto();
      completeRef.current = false;
      draggingRef.current = false;
      lastPointRef.current = null;
      brushRef.current = null;
      setIsComplete(false);
      setClearedRatio(0);
    }, [cancelAuto]);

    const ensureBrush = useCallback((strokeLen: number, strokeW: number) => {
      const keyW = Math.round(strokeLen);
      const keyH = Math.round(strokeW);
      if (
        !brushRef.current ||
        brushRef.current.width < keyW ||
        Math.abs(brushRef.current.height - keyH - 8) > 6
      ) {
        brushRef.current = createCoinBrush(strokeLen, strokeW);
      }
      return brushRef.current;
    }, []);

    const paintFoil = useCallback(() => {
      if (completeRef.current && phase === 'ready') return;
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;

      const rect = wrap.getBoundingClientRect();
      const dpr = Math.max(window.devicePixelRatio || 1, 1);
      const cssW = Math.max(rect.width, 1);
      const cssH = Math.max(rect.height, 1);
      const width = Math.max(Math.floor(cssW * dpr), 1);
      const height = Math.max(Math.floor(cssH * dpr), 1);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      drawFoil(ctx, width, height);
      brushRef.current = null;
      setClearedRatio(0);
    }, [phase]);

    // Hard reset when switching NFT or returning to locked.
    useLayoutEffect(() => {
      resetScratchState();
    }, [tokenId, resetScratchState]);

    useLayoutEffect(() => {
      if (phase === 'locked' || phase === 'preparing') {
        resetScratchState();
      }
    }, [phase, resetScratchState]);

    // Paint after canvas is in the DOM (showCanvas may remount it).
    useLayoutEffect(() => {
      if (!showCanvas) return;
      paintFoil();
    }, [showCanvas, tokenId, phase, paintFoil]);

    useEffect(() => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const observer = new ResizeObserver(() => {
        if (completeRef.current && phase === 'ready') return;
        paintFoil();
      });
      observer.observe(wrap);
      return () => observer.disconnect();
    }, [paintFoil, phase]);

    useEffect(() => () => cancelAuto(), [cancelAuto]);

    const strokeSize = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return { len: 56, width: 22 };
      const base = Math.min(canvas.width, canvas.height);
      return {
        len: Math.max(base * 0.14, 48),
        width: Math.max(base * 0.048, 18),
      };
    }, []);

    const stampScrape = useCallback(
      (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) => {
        const { len, width } = strokeSize();
        const brush = ensureBrush(len, width);
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.drawImage(brush, -brush.width * 0.15, -brush.height / 2);
        ctx.restore();
      },
      [ensureBrush, strokeSize],
    );

    const eraseStroke = useCallback(
      (clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / Math.max(rect.width, 1);
        const scaleY = canvas.height / Math.max(rect.height, 1);
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const prev = lastPointRef.current;
        if (!prev) {
          stampScrape(ctx, x, y, SCRAPE_ANGLE);
          lastPointRef.current = { x, y };
          return;
        }

        const dx = x - prev.x;
        const dy = y - prev.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 2) return;

        // Follow drag direction; keep secondary stamp on a fixed side.
        const angle = Math.atan2(dy, dx);
        const { width } = strokeSize();
        const step = Math.max(width * 0.35, 4);
        const steps = Math.max(1, Math.ceil(dist / step));
        const perp = angle + Math.PI / 2;
        const off = width * SECONDARY_OFFSET_RATIO;

        for (let i = 1; i <= steps; i += 1) {
          const t = i / steps;
          const px = prev.x + dx * t;
          const py = prev.y + dy * t;
          stampScrape(ctx, px, py, angle);
          stampScrape(ctx, px + Math.cos(perp) * off, py + Math.sin(perp) * off, angle);
        }

        lastPointRef.current = { x, y };
      },
      [stampScrape, strokeSize],
    );

    const computeClearedRatio = useCallback((): number => {
      const canvas = canvasRef.current;
      if (!canvas) return 0;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return 0;
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let transparent = 0;
      let total = 0;
      const step = SAMPLE_STRIDE * 4;
      for (let i = 3; i < data.length; i += step) {
        total += 1;
        if (data[i] === 0) transparent += 1;
      }
      return total > 0 ? transparent / total : 0;
    }, []);

    const finishScratch = useCallback(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      completeRef.current = true;
      setClearedRatio(1);
      setIsComplete(true);
      onComplete?.();
    }, [onComplete]);

    const runAutoComplete = useCallback(() => {
      if (autoRafRef.current !== null) return;
      if (completeRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) {
        finishScratch();
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        finishScratch();
        return;
      }

      const w = canvas.width;
      const h = canvas.height;
      const passes = 7;
      let frame = 0;
      const tick = () => {
        frame += 1;
        const t = Math.min(frame / 18, 1);
        const pass = Math.min(Math.floor(t * passes), passes - 1);
        const local = (t * passes) % 1;

        for (let p = 0; p <= pass; p += 1) {
          const progress = p < pass ? 1 : local;
          const yBase = (h * (p + 0.35)) / passes;
          const x0 = -w * 0.15;
          const x1 = w * 1.1;
          const x = x0 + (x1 - x0) * progress;
          const angle = SCRAPE_ANGLE;
          stampScrape(ctx, x, yBase + Math.sin(progress * Math.PI) * h * 0.04, angle);
          stampScrape(ctx, x - 18, yBase + h * 0.06, angle);
        }

        if (t >= 1) {
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
          autoRafRef.current = null;
          finishScratch();
          return;
        }
        autoRafRef.current = requestAnimationFrame(tick);
      };
      autoRafRef.current = requestAnimationFrame(tick);
    }, [finishScratch, stampScrape]);

    useImperativeHandle(
      ref,
      () => ({
        scratchFast: () => {
          if (phase !== 'ready' || completeRef.current) return;
          runAutoComplete();
        },
      }),
      [phase, runAutoComplete],
    );

    const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
      if (!canScratch) return;
      event.preventDefault();
      draggingRef.current = true;
      lastPointRef.current = null;
      event.currentTarget.setPointerCapture(event.pointerId);
      eraseStroke(event.clientX, event.clientY);
    };

    const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
      if (!draggingRef.current || !canScratch) return;
      event.preventDefault();
      eraseStroke(event.clientX, event.clientY);
    };

    const finalizeScratch = () => {
      if (!canScratch) return;
      const ratio = computeClearedRatio();
      setClearedRatio(ratio);
      if (ratio >= AUTO_COMPLETE_THRESHOLD) {
        runAutoComplete();
      }
    };

    const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      lastPointRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      finalizeScratch();
    };

    const hint =
      phase === 'locked'
        ? 'Foil is locked — reveal on-chain first'
        : phase === 'preparing'
          ? 'Preparing your sticker…'
          : isComplete || phase === 'complete'
            ? 'Fully revealed'
            : `Cleared ${Math.round(clearedRatio * 100)}% · scratch past 50% and release to finish`;

    return (
      <div className={styles.root}>
        <div
          className={[
            styles.stickerWrap,
            phase === 'locked' && styles.stickerWrapLocked,
            phase === 'preparing' && styles.stickerWrapPreparing,
          ]
            .filter(Boolean)
            .join(' ')}
          ref={wrapRef}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={`Kaomoji #${tokenId}`}
              className={styles.sticker}
              draggable={false}
            />
          ) : (
            <div className={styles.placeholder}>
              {phase === 'preparing' ? 'Loading sticker…' : 'Unrevealed Kaomoji'}
            </div>
          )}

          {showCanvas && (
            <canvas
              ref={canvasRef}
              className={[styles.scratch, !canScratch && styles.scratchLocked]
                .filter(Boolean)
                .join(' ')}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => {
                draggingRef.current = false;
                lastPointRef.current = null;
              }}
              aria-label={
                canScratch
                  ? `Scratch foil for Kaomoji #${tokenId}`
                  : `Locked scratch foil for Kaomoji #${tokenId}`
              }
              role="img"
            />
          )}

          {phase === 'preparing' && (
            <div className={styles.loadingMask} aria-live="polite">
              <span className={styles.spinner} aria-hidden="true" />
              <p className={styles.loadingText}>Reveal confirmed — loading sticker…</p>
            </div>
          )}

          {phase === 'locked' && (
            <div className={styles.lockBadge} aria-hidden="true">
              Locked until reveal
            </div>
          )}
        </div>
        <p className={styles.meta}>{hint}</p>
      </div>
    );
  },
);
