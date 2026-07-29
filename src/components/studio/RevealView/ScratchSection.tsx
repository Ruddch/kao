import styles from './RevealView.module.css';
import { useScratchProgress } from './useScratchProgress';

interface ScratchSectionProps {
  previewImage: string;
  onComplete: () => void;
}

export function ScratchSection({ previewImage, onComplete }: ScratchSectionProps) {
  const {
    canvasRef,
    containerRef,
    progress,
    isComplete,
    foilVisible,
    revealAll,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  } = useScratchProgress({ enabled: true, onComplete });

  return (
    <>
      <div className={styles.previewFrame}>
        <img src={previewImage} alt="" className={styles.previewImg} draggable={false} />
        <div ref={containerRef} className={styles.foilLayer}>
          <canvas
            ref={canvasRef}
            className={[
              styles.scratchCanvas,
              !foilVisible && styles.scratchCanvasHidden,
              isComplete && styles.scratchCanvasDone,
            ]
              .filter(Boolean)
              .join(' ')}
            aria-label="Scratch to reveal your Kaomoji"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onContextMenu={(event) => event.preventDefault()}
          />
        </div>
      </div>

      {!isComplete && (
        <>
          <div className={styles.scratchToolbar}>
            <span className={styles.scratchHint}>Scratch the foil to reveal</span>
            <button type="button" className={styles.revealAllBtn} onClick={revealAll}>
              Reveal all
            </button>
          </div>
          {progress > 0 && (
            <div
              className={styles.scratchProgress}
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className={styles.scratchProgressBar} style={{ width: `${progress * 100}%` }} />
            </div>
          )}
        </>
      )}
    </>
  );
}
