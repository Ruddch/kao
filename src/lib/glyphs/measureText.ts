export function getFontStringFromElement(el: HTMLElement): string {
  const style = getComputedStyle(el);
  return `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
}

export function measureTextWidth(text: string, font: string): number {
  if (!text) return 0;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;
  ctx.font = font;
  return ctx.measureText(text).width;
}

export function measureCaretX(
  text: string,
  caretIndex: number,
  font: string,
  containerWidth: number,
): number {
  const totalWidth = measureTextWidth(text, font);
  const prefixWidth = measureTextWidth(text.slice(0, caretIndex), font);
  const startX = Math.max(0, (containerWidth - totalWidth) / 2);
  return startX + prefixWidth;
}
