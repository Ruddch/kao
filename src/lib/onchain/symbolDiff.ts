import { editInkCost } from './inkMath';

export interface DiffResult {
  replacements: number;
  newSlots: number;
  lcsLength: number;
}

export function lcsLength(a: number[], b: number[]): number {
  const m = a.length;
  const n = b.length;
  if (m === 0 || n === 0) return 0;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        dp[i][j] = dp[i - 1][j];
      } else {
        dp[i][j] = dp[i][j - 1];
      }
    }
  }
  return dp[m][n];
}

export function diff(oldIds: number[], newIds: number[]): DiffResult {
  const lcsLen = lcsLength(oldIds, newIds);
  const oldLen = oldIds.length;
  const newLen = newIds.length;
  const deletions = oldLen - lcsLen;
  const insertions = newLen - lcsLen;
  const replacements = Math.min(deletions, insertions);
  const newSlots = insertions - replacements;
  return { replacements, newSlots, lcsLength: lcsLen };
}

export function editInkCostForDiff(
  unlockedSymbols: number,
  oldIds: number[],
  newIds: number[],
): { cost: number; diffResult: DiffResult } {
  const diffResult = diff(oldIds, newIds);
  const cost = editInkCost(unlockedSymbols, diffResult.replacements, diffResult.newSlots);
  return { cost, diffResult };
}
