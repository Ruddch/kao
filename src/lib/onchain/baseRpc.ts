import {
  createPublicClient,
  custom,
  fallback,
  http,
  type EIP1193Provider,
  type PublicClient,
  type Transport,
} from 'viem';
import { base } from 'viem/chains';

/**
 * RPC endpoint. Optional — when unset, reads prefer the connected wallet's provider
 * (MetaMask / Rabby / etc.) and fall back to public Base RPC.
 */
export function getBaseRpcUrl(): string {
  return import.meta.env.VITE_BASE_RPC_URL?.trim() || 'https://mainnet.base.org';
}

function getInjectedProvider(): EIP1193Provider | undefined {
  if (typeof window === 'undefined') return undefined;
  const eth = window.ethereum as EIP1193Provider | undefined;
  return eth?.request ? eth : undefined;
}

/** Public fallback — small HTTP batches to reduce burst rate-limit hits. */
export const baseHttpTransport: Transport = http(getBaseRpcUrl(), {
  batch: { batchSize: 8, wait: 120 },
  retryCount: 2,
  retryDelay: 2000,
  timeout: 30_000,
});

function buildTransport(): Transport {
  const customUrl = import.meta.env.VITE_BASE_RPC_URL?.trim();
  if (customUrl) return baseHttpTransport;

  const injected = getInjectedProvider();
  if (injected) {
    return fallback([custom(injected), baseHttpTransport]);
  }
  return baseHttpTransport;
}

let publicClient: PublicClient | null = null;
let transportMode: 'injected' | 'http' | null = null;

export function getBasePublicClient(): PublicClient {
  const hasCustomRpc = Boolean(import.meta.env.VITE_BASE_RPC_URL?.trim());
  const hasInjected = Boolean(getInjectedProvider());
  const mode: 'injected' | 'http' = hasCustomRpc ? 'http' : hasInjected ? 'injected' : 'http';

  if (!publicClient || transportMode !== mode) {
    transportMode = mode;
    publicClient = createPublicClient({
      chain: base,
      transport: buildTransport(),
    }) as PublicClient;
  }
  return publicClient;
}

/** Reset cached client (e.g. after wallet connect/disconnect). */
export function resetBasePublicClient(): void {
  publicClient = null;
  transportMode = null;
}

export function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /rate limit|429|too many requests/i.test(message);
}
