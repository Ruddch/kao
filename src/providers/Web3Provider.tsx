import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider } from 'connectkit';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { WagmiProvider } from 'wagmi';
import { resetBasePublicClient } from '../lib/onchain/baseRpc';
import { wagmiConfig } from '../lib/wagmi';

const queryClient = new QueryClient();

function RpcClientSync() {
  const { address, isConnected } = useAccount();
  useEffect(() => {
    resetBasePublicClient();
  }, [address, isConnected]);
  return null;
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="auto"
          options={{
            language: 'en-US',
            hideBalance: true,
            avoidLayoutShift: true,
          }}
        >
          <RpcClientSync />
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
