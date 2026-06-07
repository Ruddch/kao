import type { KaomojiTemplate, SymbolCategory } from '../../types/kaomojiEditor';

export const DEFAULT_TEMPLATE_ID = 'tpl-round-happy';

export const KAOMOJI_MAX_LENGTH = 20;

export function clampKaomoji(text: string, max = KAOMOJI_MAX_LENGTH): string {
  return [...text].slice(0, max).join('');
}

export const KAOMOJI_TEMPLATES: KaomojiTemplate[] = [
  { id: 'tpl-round-happy', label: '(◕‿◕)' },
  { id: 'tpl-square-happy', label: '[◕‿◕]' },
  { id: 'tpl-curly-wide', label: '{⊙_⊙}' },
  { id: 'tpl-round-sad', label: '(T_T)' },
  { id: 'tpl-pipe-kana', label: '|°ロ°|' },
  { id: 'tpl-round-star', label: '(✯◡✯)' },
  { id: 'tpl-bear', label: 'ʕ•ᴥ•ʔ' },
];

export const SYMBOL_CATEGORIES: SymbolCategory[] = [
  {
    id: 'frame',
    label: 'frame',
    symbols: [
      '(', ')', '[', ']', '{', '}', '（', '）', '［', '］',
      '|', '/', '\\', '「', '」', 'ʕ', 'ʔ',
    ],
  },
  {
    id: 'eyes',
    label: 'eyes',
    symbols: [
      '◕', '⊙', '−', '✧', 'T', '°', '♥', '・', 'ω', '_', '∀',
      '•', '✯', 'o', '皿', 'ロ', '▽', '◡', 'ᴥ',
    ],
  },
  {
    id: 'mouth',
    label: 'mouth',
    symbols: ['‿', 'o', 'ー', 'ω', '_', '▽', '∀', '皿', '◡', 'ロ', 'ᴥ', 'Д', '∀'],
  },
  {
    id: 'hands',
    label: 'hands',
    symbols: ['ヽ', 'ノ', 'づ', 'つ', 'っ', '╯', '╰', 'ﾉ', 'ゝ', 'ゞ', 'ᕙ', 'ᕗ'],
  },
  {
    id: 'letters',
    label: 'letters',
    symbols: ['A', 'B', 'C', 'T', 'X', 'Z', 'a', 'x', 'z'],
  },
  {
    id: 'misc',
    label: 'misc',
    symbols: ['´', '゜', '゛', '°', '・', '•', '★', '☆', '♪', '→', '←'],
  },
];

export function getTemplateById(id: string): KaomojiTemplate | undefined {
  return KAOMOJI_TEMPLATES.find((t) => t.id === id);
}

export function getDefaultTemplate(): KaomojiTemplate {
  return getTemplateById(DEFAULT_TEMPLATE_ID) ?? KAOMOJI_TEMPLATES[0];
}

export function getDefaultKaomojiText(): string {
  return getDefaultTemplate().label;
}

export function getRandomTemplate(): KaomojiTemplate {
  const index = Math.floor(Math.random() * KAOMOJI_TEMPLATES.length);
  return KAOMOJI_TEMPLATES[index] ?? getDefaultTemplate();
}

const ALLOWED_SYMBOLS = new Set(SYMBOL_CATEGORIES.flatMap((category) => category.symbols));

/** Non-whitespace chars must appear in the symbol palette. */
export function isAllowedKaomojiChar(char: string): boolean {
  if (char.length === 0) return true;
  if (/^\s$/.test(char)) return true;
  return ALLOWED_SYMBOLS.has(char);
}

export function getInsertedChars(prev: string, next: string): string[] {
  const prevChars = [...prev];
  const nextChars = [...next];
  if (nextChars.length <= prevChars.length) return [];

  const inserted: string[] = [];
  let prevIndex = 0;
  for (const char of nextChars) {
    if (prevIndex < prevChars.length && char === prevChars[prevIndex]) {
      prevIndex++;
    } else {
      inserted.push(char);
    }
  }
  return inserted;
}

export function hasNewDisallowedChar(prev: string, next: string): boolean {
  return getInsertedChars(prev, next).some((char) => !isAllowedKaomojiChar(char));
}
