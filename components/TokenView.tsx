"use client";

import { useReadContract } from "wagmi";
import Link from "next/link";
import { CardArt } from "@/components/CardArt";
import { contractAddress, explorerUrl, thanksmaxxingAbi } from "@/config/contract";
import { targetChain } from "@/config/wagmi";

export function TokenView({ tokenId }: { tokenId: string }) {
  const id = BigInt(tokenId);
  const { data: text, isLoading } = useReadContract({
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

  if (!contractAddress) {
    return <div className="token-message">The collection contract has not been deployed yet.</div>;
  }
  if (isLoading) return <div className="token-message">Finding this keepsake on Base…</div>;
  if (!text || !owner) return <div className="token-message">This keepsake could not be found.</div>;

  const shortOwner = owner.slice(0, 6) + "…" + owner.slice(-4);
  const pageUrl = typeof window === "undefined" ? "" : window.location.href;
  const shareText =
    "I’m grateful for " + text + ". Thanksmaxxing #" + tokenId + " on Base. Mint yours: ";
  const shareUrl =
    "https://twitter.com/intent/tweet?text=" +
    encodeURIComponent(shareText) +
    "&url=" +
    encodeURIComponent(pageUrl);

  return (
    <main className="token-page">
      <div className="token-title">
        <p className="eyebrow">A little thing, made permanent</p>
        <h1>Thanksmaxxing <span>#{tokenId}</span></h1>
      </div>
      <CardArt
        owner={owner}
        xUsername={xUsername}
        avatarUrl={avatarUrl}
        text={text}
        tokenId={tokenId}
      />
      <div className="token-actions">
        <a className="button button-primary" href={"/api/card/" + tokenId} download={"thanksmaxxing-" + tokenId + ".png"}>
          Download PNG <span aria-hidden="true">↓</span>
        </a>
        <a className="button button-secondary" href={shareUrl} target="_blank" rel="noreferrer">
          Share on X <span aria-hidden="true">↗</span>
        </a>
        {contractAddress ? (
          <a
            className="button button-secondary"
            href={explorerUrl() + "/token/" + contractAddress + "?a=" + tokenId}
            target="_blank"
            rel="noreferrer"
          >
            View on Basescan <span aria-hidden="true">↗</span>
          </a>
        ) : null}
      </div>
      <p className="token-note">Owned by {shortOwner}. Your gratitude message is stored on Base.</p>
      <Link className="back-link" href="/">Make your own <span aria-hidden="true">↗</span></Link>
    </main>
  );
}
