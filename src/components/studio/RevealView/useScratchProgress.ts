import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';

const GRID_SIZE = 24;
const BRUSH_RADIUS = 22;
const AUTO_THRESHOLD = 0.3;
const IDLE_MS = 500;
const PROGRESS_THROTTLE_MS = 100;

function drawFoil(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#a8a8a8');
  gradient.addColorStop(0.35, '#e4e4e4');
  gradient.addColorStop(0.65, '#d0d0d0');
  gradient.addColorStop(1, '#909090');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  for (let i = -height; i < width + height; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + height, height);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  for (let i = -height; i < width + height; i += 12) {
    ctx.beginPath();
    ctx.moveTo(i + 4, 0);
    ctx.lineTo(i + height + 4, height);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.font = '700 11px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SCRATCH TO REVEAL', width / 2, height / 2);
}

function measureProgress(
  canvas: HTMLCanvasElement,
  logicalW: number,
  logicalH: number,
): number {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 0;

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const dpr = canvas.width / logicalW;
  const cellW = logicalW / GRID_SIZE;
  const cellH = logicalH / GRID_SIZE;
  let transparent = 0;
  let total = 0;

  for (let gy = 0; gy < GRID_SIZE; gy++) {
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      const px = Math.floor((gx * cellW + cellW / 2) * dpr);
      const py = Math.floor((gy * cellH + cellH / 2) * dpr);
      const idx = (py * canvas.width + px) * 4 + 3;
      total++;
      if (data[idx] < 128) transparent++;
    }
  }

  return total > 0 ? transparent / total : 0;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface UseScratchProgressOptions {
  enabled: boolean;
  onComplete: () => void;
}

export function useScratchProgress({ enabled, onComplete }: UseScratchProgressOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const logicalSizeRef = useRef({ w: 0, h: 0 });
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [foilVisible, setFoilVisible] = useState(true);

  const progressRef = useRef(0);
  const isCompleteRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProgressAtRef = useRef(0);
  const isDrawingRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const finishScratch = useCallback(() => {
    if (isCompleteRef.current) return;
    isCompleteRef.current = true;
    setIsComplete(true);
    setProgress(1);
    progressRef.current = 1;
    clearIdleTimer();

    if (prefersReducedMotion()) {
      setFoilVisible(false);
      onCompleteRef.current();
      return;
    }

    setFoilVisible(false);
    window.setTimeout(() => {
      onCompleteRef.current();
    }, 520);
  }, [clearIdleTimer]);

  const scheduleAutoComplete = useCallback(() => {
    clearIdleTimer();
    if (progressRef.current < AUTO_THRESHOLD || isCompleteRef.current) return;

    idleTimerRef.current = setTimeout(() => {
      if (progressRef.current >= AUTO_THRESHOLD && !isCompleteRef.current) {
        finishScratch();
      }
    }, IDLE_MS);
  }, [clearIdleTimer, finishScratch]);

  const updateProgress = useCallback(() => {
    const canvas = canvasRef.current;
    const { w, h } = logicalSizeRef.current;
    if (!canvas || !w || !h || isCompleteRef.current) return;

    const now = Date.now();
    if (now - lastProgressAtRef.current < PROGRESS_THROTTLE_MS) return;
    lastProgressAtRef.current = now;

    const next = measureProgress(canvas, w, h);
    progressRef.current = next;
    setProgress(next);

    if (next >= 1) {
      finishScratch();
    }
  }, [finishScratch]);

  const scratchAt = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !enabled || isCompleteRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      updateProgress();
    },
    [enabled, updateProgress],
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (!enabled || isCompleteRef.current) return;
      event.preventDefault();
      clearIdleTimer();
      isDrawingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      scratchAt(event.clientX, event.clientY);
    },
    [clearIdleTimer, enabled, scratchAt],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !enabled || isCompleteRef.current) return;
      event.preventDefault();
      scratchAt(event.clientX, event.clientY);
    },
    [enabled, scratchAt],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      scheduleAutoComplete();
    },
    [scheduleAutoComplete],
  );

  const revealAll = useCallback(() => {
    finishScratch();
  }, [finishScratch]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) return;

    logicalSizeRef.current = { w: width, h: height };
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    drawFoil(ctx, width, height);

    progressRef.current = 0;
    isCompleteRef.current = false;
    setProgress(0);
    setIsComplete(false);
    setFoilVisible(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    initCanvas();

    const container = containerRef.current;
    if (!container) return;

    let lastW = 0;
    let lastH = 0;

    const observer = new ResizeObserver(() => {
      if (isCompleteRef.current || isDrawingRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      initCanvas();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [enabled, initCanvas]);

  useEffect(() => () => clearIdleTimer(), [clearIdleTimer]);

  return {
    canvasRef,
    containerRef,
    progress,
    isComplete,
    foilVisible,
    revealAll,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel: handlePointerUp,
  };
}
