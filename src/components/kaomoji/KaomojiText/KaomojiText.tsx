import { kaoCharFontFamily } from '../../../lib/glyphs/kaoCharFont';

interface KaomojiTextProps {
  text: string;
}

export function KaomojiText({ text }: KaomojiTextProps) {
  return (
    <>
      {[...text].map((char, index) => {
        const fontFamily = kaoCharFontFamily(char);
        if (!fontFamily) return char;
        return (
          <span key={`${index}-${char}`} style={{ fontFamily }}>
            {char}
          </span>
        );
      })}
    </>
  );
}
