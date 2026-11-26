import type { Address } from "viem";

export const thanksmaxxingAbi = [
  {
    type: "function",
    name: "mintWithX",
    stateMutability: "payable",
    inputs: [
      { name: "text", type: "string" },
      { name: "xUserId", type: "uint256" },
      { name: "username", type: "string" },
      { name: "profileImageUrl", type: "string" },
      { name: "nonce", type: "bytes32" },
      { name: "deadline", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "walletMinted",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "xAccountMinted",
    stateMutability: "view",
    inputs: [{ name: "xUserId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "nextId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "mintPrice",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "gratitude",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "xUsername",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "xUserIdOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "xProfileImageUrl",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "event",
    name: "Minted",
    anonymous: false,
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: true, name: "author", type: "address" },
      { indexed: false, name: "text", type: "string" },
      { indexed: false, name: "style", type: "uint8" },
    ],
  },
] as const;

export const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as
  | Address
  | undefined;

export function explorerUrl() {
  return targetChainId() === 8453
    ? "https://basescan.org"
    : "https://sepolia.basescan.org";
}

export function targetChainId() {
  return Number(process.env.NEXT_PUBLIC_CHAIN_ID || "84532");
}
