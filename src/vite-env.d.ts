/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REOWN_PROJECT_ID: string;
  readonly VITE_APP_URL: string;
  readonly VITE_BOHR_RPC_URL: string;
  readonly VITE_BOHR_CHAIN_ID: string;
  readonly VITE_INHERITANCE_KEY_CONTRACT_ADDRESS: string;
  readonly VITE_BOHR_EXPLORER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

