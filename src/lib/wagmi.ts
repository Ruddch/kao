import { createConfig, injected } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { chainHttpTransport } from './onchain/baseRpc';

export const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: { [mainnet.id]: chainHttpTransport },
  connectors: [injected()],
});
