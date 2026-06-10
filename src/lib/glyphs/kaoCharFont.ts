/** Per-character font overrides for kaomoji text (no glyph pack required). */
export function kaoCharFontFamily(char: string): string | undefined {
  const cp = char.codePointAt(0);
  if (cp === undefined) return undefined;

  if (cp >= 0x2200 && cp <= 0x22ff) {
    return "'Noto Sans Math', var(--font-kao)";
  }

  if (cp >= 0xff61 && cp <= 0xff9f) {
    return "'Noto Sans JP', var(--font-kao)";
  }

  return undefined;
}

export function setKaomojiTextContent(element: HTMLElement, text: string): void {
  element.replaceChildren();

  for (const char of text) {
    const fontFamily = kaoCharFontFamily(char);
    if (!fontFamily) {
      element.appendChild(document.createTextNode(char));
      continue;
    }

    const span = document.createElement('span');
    span.style.fontFamily = fontFamily;
    span.textContent = char;
    element.appendChild(span);
  }
}
