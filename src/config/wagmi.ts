import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { defineChain } from 'viem';

export const bohrTestnet = defineChain({
  id: Number(import.meta.env.VITE_BOHR_CHAIN_ID || 968),
  name: 'Bohr Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_BOHR_RPC_URL || 'https://rpc.bohr.life'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Bohr Scan',
      url: import.meta.env.VITE_BOHR_EXPLORER_URL || 'https://scan.bohr.life',
    },
  },
  testnet: true,
});

export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'b0ed2f41971704df2800043e6799378c';

export const wagmiAdapter = new WagmiAdapter({
  networks: [bohrTestnet],
  projectId,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig as any;

const appUrl = import.meta.env.VITE_APP_URL || 'https://inheritance-key.vercel.app';

// Initialize Reown AppKit Modal
createAppKit({
  adapters: [wagmiAdapter],
  networks: [bohrTestnet],
  projectId,
  metadata: {
    name: 'InheritanceKey',
    description: 'Programmable Digital Ownership Succession Protocol',
    url: appUrl,
    icons: [`${appUrl}/key-logo.svg`],
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#6366F1',
    '--w3m-border-radius-master': '8px',
  },
});
