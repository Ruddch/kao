import { createConfig, http, injected } from 'wagmi';
import { mainnet } from 'wagmi/chains';

export const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
  connectors: [injected()],
});
