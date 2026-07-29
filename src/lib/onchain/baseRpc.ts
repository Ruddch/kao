import {
  createPublicClient,
  custom,
  fallback,
  http,
  type EIP1193Provider,
  type PublicClient,
  type Transport,
} from 'viem';
import { mainnet } from 'viem/chains';

/**
 * Ethereum mainnet RPC. Optional — when unset, reads prefer the connected wallet's
 * provider (MetaMask / Rabby / etc.) and fall back to a public ETH RPC.
 */
export function getChainRpcUrl(): string {
  return (
    import.meta.env.VITE_ETH_RPC_URL?.trim() ||
    import.meta.env.VITE_BASE_RPC_URL?.trim() ||
    'https://ethereum.publicnode.com'
  );
}

/** @deprecated Use getChainRpcUrl */
export const getBaseRpcUrl = getChainRpcUrl;

function getInjectedProvider(): EIP1193Provider | undefined {
  if (typeof window === 'undefined') return undefined;
  const eth = window.ethereum as EIP1193Provider | undefined;
  return eth?.request ? eth : undefined;
}

/** Public fallback — small HTTP batches to reduce burst rate-limit hits. */
export const chainHttpTransport: Transport = http(getChainRpcUrl(), {
  batch: { batchSize: 8, wait: 120 },
  retryCount: 2,
  retryDelay: 2000,
  timeout: 30_000,
});

/** @deprecated Use chainHttpTransport */
export const baseHttpTransport = chainHttpTransport;

function buildTransport(): Transport {
  const customUrl =
    import.meta.env.VITE_ETH_RPC_URL?.trim() ||
    import.meta.env.VITE_BASE_RPC_URL?.trim();
  if (customUrl) return chainHttpTransport;

  const injected = getInjectedProvider();
  if (injected) {
    return fallback([custom(injected), chainHttpTransport]);
  }
  return chainHttpTransport;
}

let publicClient: PublicClient | null = null;
let transportMode: 'injected' | 'http' | null = null;

export function getChainPublicClient(): PublicClient {
  const hasCustomRpc = Boolean(
    import.meta.env.VITE_ETH_RPC_URL?.trim() ||
      import.meta.env.VITE_BASE_RPC_URL?.trim(),
  );
  const hasInjected = Boolean(getInjectedProvider());
  const mode: 'injected' | 'http' = hasCustomRpc ? 'http' : hasInjected ? 'injected' : 'http';

  if (!publicClient || transportMode !== mode) {
    transportMode = mode;
    publicClient = createPublicClient({
      chain: mainnet,
      transport: buildTransport(),
    }) as PublicClient;
  }
  return publicClient;
}

/** @deprecated Use getChainPublicClient */
export const getBasePublicClient = getChainPublicClient;

/** Reset cached client (e.g. after wallet connect/disconnect). */
export function resetChainPublicClient(): void {
  publicClient = null;
  transportMode = null;
}

/** @deprecated Use resetChainPublicClient */
export const resetBasePublicClient = resetChainPublicClient;

export function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /rate limit|429|too many requests/i.test(message);
}
