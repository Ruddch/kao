export interface MarqueeSegment {
  text: string;
  /** Block background — falls back to strip backgroundColor */
  backgroundColor?: string;
  /** Block text color — falls back to strip color */
  color?: string;
}

export interface MarqueeConfig {
  enabled: boolean;
  /** Default strip + block colors when segment omits its own */
  backgroundColor: string;
  color: string;
  /** Ordered blocks in one loop unit */
  segments: MarqueeSegment[];
  /** How many times the block sequence is tiled in the track (whitelist uses 4) */
  repeatGroups: number;
  durationSeconds: number;
  heightPx?: number;
}

/** Home marquee — segmented blocks like kaomoji.world/whitelist */
export const homeMarqueeConfig: MarqueeConfig = {
  enabled: true,
  backgroundColor: 'var(--pop-yellow)',
  color: 'var(--fg)',
  repeatGroups: 4,
  durationSeconds: 28,
  heightPx: 44,
  segments: [
    {
      text: 'BURN · INK · EXPAND',
      backgroundColor: 'var(--pop-red)',
      color: 'var(--surface)',
    },
    { text: 'デジタルペット' },
    { text: 'SCULPT YOUR KAOMOJI' },
    {
      text: 'カオモジ KAOMOJI',
      backgroundColor: 'var(--pop-red)',
      color: 'var(--surface)',
    },
    { text: 'THE FACE THAT KNOWS YOU' },
    { text: 'TRY THE EDITOR' },
  ],
};

/** Studio page marquee */
export const studioMarqueeConfig: MarqueeConfig = {
  enabled: true,
  backgroundColor: 'var(--fg)',
  color: 'var(--pop-yellow)',
  repeatGroups: 4,
  durationSeconds: 22,
  heightPx: 44,
  segments: [
    {
      text: 'STUDIO',
      backgroundColor: 'var(--pop-red)',
      color: 'var(--surface)',
    },
    { text: 'BURN NFT · EARN POINTS' },
    {
      text: 'カオモジ',
      backgroundColor: 'var(--pop-cyan)',
      color: 'var(--fg)',
    },
    { text: 'CUSTOMIZE YOUR CHARACTER' },
    {
      text: 'MODIFY · BURN',
      backgroundColor: 'var(--pop-red)',
      color: 'var(--surface)',
    },
    { text: 'YOUR DIGITAL COMPANION' },
  ],
};

/** Example whitelist-style copy — swap into homeMarqueeConfig.segments if needed */
export const whitelistMarqueeSegments: MarqueeSegment[] = [
  {
    text: 'WHITELIST OPEN',
    backgroundColor: 'var(--pop-red)',
    color: 'var(--surface)',
  },
  { text: 'Connect Twitter & Earn Points' },
  {
    text: 'カオモジ KAOMOJI NFT',
    backgroundColor: 'var(--pop-red)',
    color: 'var(--surface)',
  },
  { text: 'Follow + Like + Repost = More Points' },
  { text: 'Referral: +3 pts per approved friend' },
  { text: 'Apply Now — Limited Spots' },
];
