import {
  createPublicClient,
  fallback,
  http,
  type PublicClient,
  type Transport,
} from 'viem';
import { mainnet } from 'viem/chains';

/** Public Ethereum mainnet RPCs — used when env is missing or points at Base by mistake. */
const ETH_PUBLIC_RPCS = [
  'https://ethereum.publicnode.com',
  'https://rpc.ankr.com/eth',
  'https://cloudflare-eth.com',
] as const;

/**
 * Reject leftover Base endpoints (common after migration if Cloudflare still
 * has VITE_BASE_RPC_URL or a mis-set VITE_ETH_RPC_URL).
 */
function isBaseRpcUrl(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes('mainnet.base.org') ||
    u.includes('base-mainnet') ||
    u.includes('base-sepolia') ||
    u.includes('/base/') ||
    /(^|[/.])base\.(org|network)/.test(u)
  );
}

/**
 * Ethereum mainnet RPC for contract reads.
 * Always HTTP — never the injected wallet.
 * If env is unset or still a Base URL → public ETH fallbacks.
 */
export function getChainRpcUrl(): string {
  const configured = import.meta.env.VITE_ETH_RPC_URL?.trim();
  if (configured && !isBaseRpcUrl(configured)) return configured;
  return ETH_PUBLIC_RPCS[0];
}

/** @deprecated Use getChainRpcUrl */
export const getBaseRpcUrl = getChainRpcUrl;

function buildHttpTransport(url: string): Transport {
  return http(url, {
    batch: { batchSize: 20, wait: 50 },
    retryCount: 2,
    retryDelay: 1500,
    timeout: 45_000,
  });
}

/** Prefer configured ETH RPC, then public ETH fallbacks. Never Base. */
function buildChainTransport(): Transport {
  const preferred = getChainRpcUrl();
  const urls = [preferred, ...ETH_PUBLIC_RPCS.filter((u) => u !== preferred)];
  if (urls.length === 1) return buildHttpTransport(urls[0]);
  return fallback(urls.map((url) => buildHttpTransport(url)));
}

/** @deprecated Use getChainPublicClient transport */
export const chainHttpTransport: Transport = buildChainTransport();

/** @deprecated Use chainHttpTransport */
export const baseHttpTransport = chainHttpTransport;

let publicClient: PublicClient | null = null;
let cachedKey: string | null = null;

export function getChainPublicClient(): PublicClient {
  const key = getChainRpcUrl();
  if (!publicClient || cachedKey !== key) {
    cachedKey = key;
    publicClient = createPublicClient({
      chain: mainnet,
      transport: buildChainTransport(),
    }) as PublicClient;
  }
  return publicClient;
}

/** @deprecated Use getChainPublicClient */
export const getBasePublicClient = getChainPublicClient;

/** Reset cached client (e.g. after env / wallet session changes). */
export function resetChainPublicClient(): void {
  publicClient = null;
  cachedKey = null;
}

/** @deprecated Use resetChainPublicClient */
export const resetBasePublicClient = resetChainPublicClient;

export function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /rate limit|429|too many requests/i.test(message);
}
