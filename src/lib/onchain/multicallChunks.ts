import type { ContractFunctionParameters, PublicClient } from 'viem';
import { isRateLimitError } from './baseRpc';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type MulticallContract = ContractFunctionParameters;

export interface MulticallChunkOptions {
  chunkSize?: number;
  delayMs?: number;
  allowFailure?: boolean;
  maxRetries?: number;
}

/**
 * Runs multicall in small sequential chunks with backoff on rate-limit errors.
 * Public Base RPC rejects large aggregate3 payloads; chunking keeps reads reliable.
 */
export async function multicallInChunks(
  client: PublicClient,
  contracts: readonly MulticallContract[],
  options: MulticallChunkOptions = {},
): Promise<unknown[]> {
  const {
    chunkSize = 24,
    delayMs = 400,
    allowFailure = true,
    maxRetries = 3,
  } = options;

  if (contracts.length === 0) return [];

  const merged: unknown[] = [];

  for (let offset = 0; offset < contracts.length; offset += chunkSize) {
    const chunk = contracts.slice(offset, offset + chunkSize);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const rows = await client.multicall({
          contracts: chunk,
          allowFailure,
        });
        merged.push(...rows);
        break;
      } catch (error) {
        const canRetry = isRateLimitError(error) && attempt < maxRetries;
        if (!canRetry) throw error;
        await sleep(delayMs * (attempt + 2));
      }
    }

    if (offset + chunkSize < contracts.length) {
      await sleep(delayMs);
    }
  }

  return merged;
}

export type MulticallResultRow = { status: 'success'; result: unknown } | { status: 'failure'; error: unknown };

export function isMulticallSuccess(
  row: unknown,
): row is { status: 'success'; result: unknown } {
  return (
    typeof row === 'object' &&
    row !== null &&
    'status' in row &&
    (row as MulticallResultRow).status === 'success'
  );
}
