export interface MintPhase {
  id: string;
  label: string;
  status: 'live' | 'upcoming' | 'ended';
  startsAt: string | null;
  price: string | null;
  limitPerWallet: number;
  description: string;
}

export const MINT_PHASES: MintPhase[] = [
  {
    id: 'gtd',
    label: 'GTD',
    status: 'upcoming',
    startsAt: 'TBA',
    price: 'TBA',
    limitPerWallet: 0,
    description: 'Holders of partner collections and early supporters.',
  },
  {
    id: 'fcfs',
    label: 'FCFS',
    status: 'upcoming',
    startsAt: 'TBA',
    price: 'TBA',
    limitPerWallet: 0,
    description: 'Holders of partner collections and early supporters.',
  },
  {
    id: 'public',
    label: 'Public Mint',
    status: 'upcoming',
    startsAt: 'TBA',
    price: 'TBA',
    limitPerWallet: 0,
    description: 'Open to everyone. FCFS.',
  },
];

// Mock whitelist — addresses eligible per phase
export const MOCK_WHITELIST: Record<string, string[]> = {
  gtd: [
    '0x1111111111111111111111111111111111111111',
    '0x2222222222222222222222222222222222222222',
    '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    '0xBA2037ddD464a70CAadBDC8e1c62Fac6C54f5790'
  ],
  fcfs: [
    '0x3333333333333333333333333333333333333333',
    '0x4444444444444444444444444444444444444444',
    '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
  ],
  public: [], // everyone is eligible (cascades from checker logic)
};

export const TOTAL_SUPPLY = '10,000';
export const AVAILABLE = 'TBA';
