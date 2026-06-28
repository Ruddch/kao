export const REPLACEMENT_INK = 10;
export const UNLOCK_BASE = 10;
export const UNLOCK_QUAD_COEF = 3;
export const BURN_LINEAR_NUM = 35;
export const MAX_LEVEL = 50;
export const MAX_ANIMATED_SLOTS = 10;
export const ANIMATED_SLOT_LEVEL_STEP = 5;

export function roundToNearest5(value: number): number {
  return Math.floor((value + 2) / 5) * 5;
}

export function unlockSymbolCost(symbolIndex: number): number {
  if (symbolIndex < 6) throw new Error('InkMath: symbolIndex < 6');
  const delta = symbolIndex - 6;
  const raw = UNLOCK_BASE + UNLOCK_QUAD_COEF * delta * delta;
  return roundToNearest5(raw);
}

export function burnReward(unlockedSymbols: number): number {
  if (unlockedSymbols < 5) throw new Error('InkMath: unlockedSymbols < 5');
  const tenths = 100 + (unlockedSymbols - 5) * BURN_LINEAR_NUM;
  return Math.floor((tenths + 25) / 50) * 5;
}

export function editInkCost(
  unlockedSymbols: number,
  replacements: number,
  newSlots: number,
): number {
  let total = replacements * REPLACEMENT_INK;
  for (let i = 0; i < newSlots; i++) {
    const nextIndex = unlockedSymbols + i + 1;
    total += unlockSymbolCost(nextIndex);
  }
  return total;
}

export function levelThreshold(level: number): number {
  if (level <= 1) return 0;
  if (level === 2) return 10;
  let total = 10;
  for (let current = 3; current <= level; current++) {
    total += 8 + 2 * (current - 2);
  }
  return total;
}

export function levelFromInkReceived(inkReceived: number): number {
  let level = 1;
  for (let candidate = 2; candidate <= MAX_LEVEL; candidate++) {
    if (inkReceived >= levelThreshold(candidate)) {
      level = candidate;
    } else {
      break;
    }
  }
  return level;
}

export function animatedSlotsUnlocked(level: number): number {
  if (level < ANIMATED_SLOT_LEVEL_STEP) return 0;
  const slots = Math.floor(level / ANIMATED_SLOT_LEVEL_STEP);
  return slots > MAX_ANIMATED_SLOTS ? MAX_ANIMATED_SLOTS : slots;
}
