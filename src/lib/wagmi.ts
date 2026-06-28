import { createConfig, injected } from 'wagmi';
import { base } from 'wagmi/chains';
import { baseHttpTransport } from './onchain/baseRpc';

export const wagmiConfig = createConfig({
  chains: [base],
  transports: { [base.id]: baseHttpTransport },
  connectors: [injected()],
});
