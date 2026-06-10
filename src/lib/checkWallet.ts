import { supabase, isSupabaseConfigured } from './supabase';

export type PhaseEligibility = Record<'gtd' | 'fcfs' | 'public', boolean>;

export type CheckWalletError = 'invalid_address' | 'unavailable';

/** RPC `check_wl` responses from Supabase */
export type CheckWlResult =
  | { found: true; gtd: boolean; fcfs: boolean }
  | { found: false };

function normalizeAddr(addr: string) {
  return addr.trim().toLowerCase();
}

export function isEthAddress(v: string) {
  return /^0x[a-f0-9]{40}$/i.test(v.trim());
}

export function toPhaseEligibility(data: CheckWlResult): PhaseEligibility {
  if (!data.found) {
    return { gtd: false, fcfs: false, public: true };
  }

  return {
    gtd: data.gtd,
    fcfs: data.gtd || data.fcfs,
    public: true,
  };
}

export async function checkWallet(
  address: string,
): Promise<PhaseEligibility | { error: CheckWalletError }> {
  const addr = normalizeAddr(address);

  if (!/^0x[a-f0-9]{40}$/.test(addr)) {
    return { error: 'invalid_address' };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { error: 'unavailable' };
  }

  const { data, error } = await supabase.rpc('check_wl', { addr });

  if (error) throw error;

  return toPhaseEligibility(data as CheckWlResult);
}
