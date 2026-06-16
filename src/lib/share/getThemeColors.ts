export interface ThemeColors {
  popYellow: string;
  popRed: string;
  surface: string;
  fg: string;
  fontKao: string;
  fontDisplay: string;
  fontMono: string;
}

export function getThemeColors(): ThemeColors {
  const root = getComputedStyle(document.documentElement);
  return {
    popYellow: root.getPropertyValue('--pop-yellow').trim(),
    popRed: root.getPropertyValue('--pop-red').trim(),
    surface: root.getPropertyValue('--surface').trim(),
    fg: root.getPropertyValue('--fg').trim(),
    fontKao: root.getPropertyValue('--font-kao').trim(),
    fontDisplay: root.getPropertyValue('--font-display').trim(),
    fontMono: root.getPropertyValue('--font-mono').trim(),
  };
}

export function resolveFontFamily(family: string, fallback = "'Noto Sans JP', sans-serif"): string {
  if (!family.startsWith('var(')) return family;
  const varName = family.match(/var\(([^)]+)\)/)?.[1]?.trim();
  if (!varName) return fallback;
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return resolved || fallback;
}
