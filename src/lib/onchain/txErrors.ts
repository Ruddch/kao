/** Map common contract revert names to user-facing Studio messages. */
export function formatContractError(message: string): string {
  if (message.includes('InvalidAnimationPair')) {
    return 'Invalid animation pair — choose a different alternate symbol for this slot.';
  }
  if (message.includes('TooManyAnimatedSymbols')) {
    return 'Too many animated symbols for your current level.';
  }
  if (message.includes('UnsupportedAnimationMode')) {
    return 'Unsupported animation mode in composition.';
  }
  return message;
}
