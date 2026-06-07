export type StudioBgColor =
  | 'yellow'
  | 'cyan'
  | 'pink'
  | 'green'
  | 'white'
  | 'mint'
  | 'red'
  | 'blue'
  | 'orange';

export const STUDIO_BG_OPTIONS: { id: StudioBgColor; label: string }[] = [
  { id: 'yellow', label: 'Yellow' },
  { id: 'cyan', label: 'Cyan' },
  { id: 'pink', label: 'Pink' },
  { id: 'green', label: 'Green' },
  { id: 'white', label: 'White' },
  { id: 'mint', label: 'Mint' },
  { id: 'blue', label: 'Blue' },
  { id: 'orange', label: 'Orange' },
];

/** Contrasting plate color for each main background */
export const PLATE_CONTRAST: Record<StudioBgColor, StudioBgColor> = {
  yellow: 'red',
  cyan: 'pink',
  pink: 'cyan',
  green: 'red',
  white: 'red',
  mint: 'pink',
  red: 'cyan',
  blue: 'pink',
  orange: 'blue',
};

export const LIGHT_TEXT_COLORS: StudioBgColor[] = ['red', 'blue'];

export function isDarkStudioBg(bg: StudioBgColor): boolean {
  return LIGHT_TEXT_COLORS.includes(bg);
}

export function getRandomBgColor(): StudioBgColor {
  const index = Math.floor(Math.random() * STUDIO_BG_OPTIONS.length);
  return STUDIO_BG_OPTIONS[index]?.id ?? 'yellow';
}

export function capitalizeColorId(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}
