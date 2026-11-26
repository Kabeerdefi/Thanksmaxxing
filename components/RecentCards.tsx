"use client";

import Link from "next/link";
import { useReadContract } from "wagmi";
import { contractAddress, thanksmaxxingAbi } from "@/config/contract";
import { targetChain } from "@/config/wagmi";
import { CardArt } from "@/components/CardArt";

export function RecentCards({ limit = 3 }: { limit?: number }) {
  const { data: nextId, isLoading } = useReadContract({
    address: contractAddress,
    abi: thanksmaxxingAbi,
    functionName: "nextId",
    chainId: targetChain.id,
    query: { enabled: Boolean(contractAddress) },
  });
  const total = nextId && nextId > 0n ? nextId - 1n : 0n;
  const start = total > BigInt(limit) ? total - BigInt(limit) + 1n : 1n;
  const ids =
    total === 0n
      ? []
      : Array.from(
          { length: Number(total - start + 1n) },
          (_, index) => total - BigInt(index),
        );

  if (!contractAddress) {
    return (
      <div className="empty-wall">
        <span className="empty-spark" aria-hidden="true">✳</span>
        <p>The wall opens when the first card is minted.</p>
      </div>
    );
  }

  if (isLoading) return <div className="empty-wall"><p>Reading the wall from Base…</p></div>;
  if (ids.length === 0) {
    return (
      <div className="empty-wall">
        <span className="empty-spark" aria-hidden="true">✳</span>
        <p>Be the first to leave a little gratitude here.</p>
        <a href="#mint">Make the first card <span aria-hidden="true">↗</span></a>
      </div>
    );
  }

  return (
    <div className="recent-grid">
      {ids.map((id) => <RecentCard key={id.toString()} id={id} />)}
    </div>
  );
}

function RecentCard({ id }: { id: bigint }) {
  const { data: text } = useReadContract({
    address: contractAddress,
    abi: thanksmaxxingAbi,
    functionName: "gratitude",
    args: [id],
    chainId: targetChain.id,
    query: { enabled: Boolean(contractAddress) },
  });
  const { data: owner } = useReadContract({
    address: contractAddress,
    abi: thanksmaxxingAbi,
    functionName: "ownerOf",
    args: [id],
    chainId: targetChain.id,
    query: { enabled: Boolean(contractAddress) },
  });
  const { data: xUsername } = useReadContract({
    address: contractAddress,
    abi: thanksmaxxingAbi,
    functionName: "xUsername",
    args: [id],
    chainId: targetChain.id,
    query: { enabled: Boolean(contractAddress) },
  });
  const { data: avatarUrl } = useReadContract({
    address: contractAddress,
    abi: thanksmaxxingAbi,
    functionName: "xProfileImageUrl",
    args: [id],
    chainId: targetChain.id,
    query: { enabled: Boolean(contractAddress) },
  });

  return (
    <Link className="recent-card-link" href={"/t/" + id.toString()}>
      <CardArt
        text={text || "A little gratitude, kept forever."}
        owner={owner}
        xUsername={xUsername}
        avatarUrl={avatarUrl}
        tokenId={id.toString()}
      />
    </Link>
  );
}
