import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";
import { contractAddress, thanksmaxxingAbi } from "@/config/contract";

export const runtime = "nodejs";

function publicClient() {
  const chain = process.env.NEXT_PUBLIC_CHAIN_ID === "8453" ? base : baseSepolia;
  const rpc =
    process.env.NEXT_PUBLIC_BASE_RPC_URL ||
    (chain.id === base.id ? "https://mainnet.base.org" : "https://sepolia.base.org");
  return createPublicClient({ chain, transport: http(rpc) });
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[1-9][0-9]*$/.test(id)) {
    return NextResponse.json({ error: "Invalid token id" }, { status: 400 });
  }
  if (!contractAddress) {
    return NextResponse.json({ error: "The collection is not deployed" }, { status: 503 });
  }

  try {
    const client = publicClient();
    const tokenId = BigInt(id);
    const [text, owner, xUsername, xUserId] = await Promise.all([
      client.readContract({
        address: contractAddress,
        abi: thanksmaxxingAbi,
        functionName: "gratitude",
        args: [tokenId],
      }),
      client.readContract({
        address: contractAddress,
        abi: thanksmaxxingAbi,
        functionName: "ownerOf",
        args: [tokenId],
      }),
      client.readContract({
        address: contractAddress,
        abi: thanksmaxxingAbi,
        functionName: "xUsername",
        args: [tokenId],
      }),
      client.readContract({
        address: contractAddress,
        abi: thanksmaxxingAbi,
        functionName: "xUserIdOf",
        args: [tokenId],
      }),
    ]);
    const origin = new URL(request.url).origin;
    return NextResponse.json({
      name: "Thanksmaxxing #" + id,
      description: "A gratitude card submitted by the owner of the connected X account. I’m grateful for " + text,
      image: origin + "/api/card/" + id,
      external_url: origin + "/t/" + id,
      attributes: [
        { trait_type: "Gratitude", value: text },
        { trait_type: "Card template", value: "Thanksgiving 2026" },
        { trait_type: "Owner", value: owner },
        { trait_type: "X username", value: xUsername },
        { trait_type: "Verified X user ID", value: xUserId.toString() },
        { trait_type: "Occasion", value: "Thanksgiving 2026" },
      ],
    });
  } catch {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }
}
