import type { CSSProperties } from 'react';
import type { MarqueeConfig, MarqueeSegment } from '../../../config/marquee';
import styles from './MarqueeStrip.module.css';

export interface MarqueeStripProps {
  config: MarqueeConfig;
}

function segmentStyle(
  segment: MarqueeSegment,
  defaults: Pick<MarqueeConfig, 'backgroundColor' | 'color'>,
): CSSProperties {
  return {
    backgroundColor: segment.backgroundColor ?? defaults.backgroundColor,
    color: segment.color ?? defaults.color,
  };
}

function SegmentBlocks({
  segments,
  defaults,
  groupIndex,
}: {
  segments: MarqueeSegment[];
  defaults: Pick<MarqueeConfig, 'backgroundColor' | 'color'>;
  groupIndex: number;
}) {
  return (
    <>
      {segments.map((segment, index) => (
        <span
          key={`${groupIndex}-${index}`}
          className={styles.segment}
          style={segmentStyle(segment, defaults)}
        >
          {segment.text}
        </span>
      ))}
    </>
  );
}

export function MarqueeStrip({ config }: MarqueeStripProps) {
  if (!config.enabled || config.segments.length === 0) return null;

  const repeatCount = Math.max(2, config.repeatGroups);
  const cssVars = {
    '--marquee-duration': `${config.durationSeconds}s`,
    '--marquee-height': config.heightPx ? `${config.heightPx}px` : 'var(--strip-height)',
  } as CSSProperties;

  const defaults = {
    backgroundColor: config.backgroundColor,
    color: config.color,
  };

  return (
    <div className={styles.wrap} style={cssVars} aria-hidden="true">
      <div className={styles.track}>
        <div className={styles.group} data-marquee-segment="">
          {Array.from({ length: repeatCount }, (_, groupIndex) => (
            <SegmentBlocks
              key={groupIndex}
              segments={config.segments}
              defaults={defaults}
              groupIndex={groupIndex}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
