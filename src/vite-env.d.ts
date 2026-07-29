/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Ethereum mainnet RPC URL (Alchemy / Infura / etc.). */
  readonly VITE_ETH_RPC_URL?: string;
  /** OpenSea API key (from GitHub Secret OPENSEA_API_KEY at build). */
  readonly VITE_OPENSEA_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  ethereum?: import('viem').EIP1193Provider;
}
