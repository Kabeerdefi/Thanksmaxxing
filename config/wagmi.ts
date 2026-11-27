import { base, baseSepolia } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";
import { cookieStorage, createConfig, createStorage, http } from "wagmi";

export const targetChain =
  process.env.NEXT_PUBLIC_CHAIN_ID === String(base.id) ? base : baseSepolia;

const rpcUrl =
  process.env.NEXT_PUBLIC_BASE_RPC_URL ||
  (targetChain.id === base.id ? "https://mainnet.base.org" : "https://sepolia.base.org");

export const wagmiConfig = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    injected(),
    coinbaseWallet({
      appName: "Thanksmaxxing",
      preference: "all",
    }),
  ],
  multiInjectedProviderDiscovery: true,
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [baseSepolia.id]: http(rpcUrl),
    [base.id]: http(rpcUrl),
  },
});
