import type { Metadata } from "next";
import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";
import { TokenView } from "@/components/TokenView";
import { contractAddress, thanksmaxxingAbi } from "@/config/contract";

type PageProps = { params: Promise<{ id: string }> };

function getPublicClient() {
  const chain = process.env.NEXT_PUBLIC_CHAIN_ID === "8453" ? base : baseSepolia;
  const rpc =
    process.env.NEXT_PUBLIC_BASE_RPC_URL ||
    (chain.id === base.id ? "https://mainnet.base.org" : "https://sepolia.base.org");
  return createPublicClient({ chain, transport: http(rpc) });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const image = siteUrl + "/api/card/" + id;
  let title = "Thanksmaxxing #" + id;
  let description = "A little gratitude, kept forever on Base.";

  if (contractAddress && /^[1-9][0-9]*$/.test(id)) {
    try {
      const client = getPublicClient();
      const text = await client.readContract({
        address: contractAddress,
        abi: thanksmaxxingAbi,
        functionName: "gratitude",
        args: [BigInt(id)],
      });
      title = "Thanksmaxxing #" + id + " — a little gratitude, kept forever";
      description = "I’m grateful for " + text;
    } catch {
      // The card can be minted before social crawlers request its metadata.
    }
  }

  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: [{ url: image, width: 960, height: 1280 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function TokenPage({ params }: PageProps) {
  const { id } = await params;
  if (!/^[1-9][0-9]*$/.test(id)) {
    return <main className="token-page"><div className="token-message">That card number is not valid.</div></main>;
  }
  return <TokenView tokenId={id} />;
}
