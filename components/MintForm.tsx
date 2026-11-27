"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { decodeEventLog, formatEther, type Hex } from "viem";
import {
  useAccount,
  useChainId,
  useReadContract,
  useSignMessage,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { contractAddress, thanksmaxxingAbi } from "@/config/contract";
import { targetChain } from "@/config/wagmi";
import { CardArt } from "@/components/CardArt";
import { WalletButton } from "@/components/WalletButton";

const maxTextBytes = 600;

type XProfile = {
  id: string;
  username: string;
  profileImageUrl: string;
};

type ErrorResponse = { error?: string };

export function MintForm() {
  const [text, setText] = useState("");
  const [xProfile, setXProfile] = useState<XProfile | null>(null);
  const [isLoadingX, setIsLoadingX] = useState(true);
  const [ethUsd, setEthUsd] = useState<number | null>(null);
  const [isAttesting, setIsAttesting] = useState(false);
  const [flowError, setFlowError] = useState("");
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const { data: mintPrice } = useReadContract({
    address: contractAddress,
    abi: thanksmaxxingAbi,
    functionName: "mintPrice",
    chainId: targetChain.id,
    query: { enabled: Boolean(contractAddress) },
  });
  const { data: nextId } = useReadContract({
    address: contractAddress,
    abi: thanksmaxxingAbi,
    functionName: "nextId",
    chainId: targetChain.id,
    query: { enabled: Boolean(contractAddress) },
  });
  const { data: walletMinted } = useReadContract({
    address: contractAddress,
    abi: thanksmaxxingAbi,
    functionName: "walletMinted",
    args: address ? [address] : undefined,
    chainId: targetChain.id,
    query: { enabled: Boolean(contractAddress && address) },
  });
  const { data: xAccountMinted } = useReadContract({
    address: contractAddress,
    abi: thanksmaxxingAbi,
    functionName: "xAccountMinted",
    args: xProfile ? [BigInt(xProfile.id)] : undefined,
    chainId: targetChain.id,
    query: { enabled: Boolean(contractAddress && xProfile) },
  });
  const {
    data: hash,
    error: writeError,
    isPending: isWriting,
    writeContract,
  } = useWriteContract();
  const {
    data: receipt,
    error: receiptError,
    isLoading: isConfirming,
  } = useWaitForTransactionReceipt({ hash, chainId: targetChain.id });

  const textBytes = useMemo(() => new TextEncoder().encode(text).length, [text]);
  const isConfigured = Boolean(contractAddress);
  const isWrongNetwork = isConnected && chainId !== targetChain.id;
  const priceLabel = mintPrice === undefined ? "Set after deployment" : formatEther(mintPrice) + " ETH";
  const usdWorth = useMemo(() => {
    if (mintPrice === undefined || ethUsd === null) return null;
    const usd = Number(formatEther(mintPrice)) * ethUsd;
    if (!Number.isFinite(usd)) return null;
    return usd < 0.01 ? "≈ $" + usd.toFixed(4) + " USD" : "≈ $" + usd.toFixed(2) + " USD";
  }, [mintPrice, ethUsd]);
  const hasAlreadyMinted = walletMinted === true || xAccountMinted === true;

  useEffect(() => {
    let active = true;
    fetch("/api/auth/x/session", { cache: "no-store" })
      .then(async (response) => (await response.json()) as { connected?: boolean; profile?: XProfile })
      .then((result) => {
        if (!active) return;
        if (result.connected && result.profile) {
          setXProfile(result.profile);
          return;
        }
        const xErr = new URLSearchParams(window.location.search).get("x_error");
        if (xErr) {
          setFlowError("X sign-in failed (" + xErr + "). Please try again.");
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setIsLoadingX(false);
      });
    fetch("/api/eth-price")
      .then(async (response) => (await response.json()) as { usd?: number | null })
      .then((result) => {
        if (active && typeof result.usd === "number" && result.usd > 0) setEthUsd(result.usd);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!receipt || !contractAddress) return;
    for (const log of receipt.logs) {
      try {
        if (log.address.toLowerCase() !== contractAddress.toLowerCase()) continue;
        const decoded = decodeEventLog({
          abi: thanksmaxxingAbi,
          eventName: "Minted",
          data: log.data,
          topics: log.topics,
        });
        router.push("/t/" + decoded.args.id.toString());
        return;
      } catch {
        // Ignore logs from token receiver hooks and other contracts.
      }
    }
  }, [receipt, router]);

  async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, { ...init, cache: "no-store" });
    const result = (await response.json()) as T & ErrorResponse;
    if (!response.ok) throw new Error(result.error || "Request failed. Try again.");
    return result;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contractAddress || mintPrice === undefined || !xProfile || !address) return;
    if (text.trim().length === 0 || textBytes > maxTextBytes || hasAlreadyMinted) return;
    setFlowError("");
    if (isWrongNetwork) {
      switchChain({ chainId: targetChain.id });
      return;
    }

    setIsAttesting(true);
    try {
      const challenge = await requestJson<{ message: string }>(
        "/api/x/challenge?wallet=" + encodeURIComponent(address),
      );
      const walletSignature = await signMessageAsync({ message: challenge.message });
      const attestation = await requestJson<{
        xUserId: string;
        username: string;
        profileImageUrl: string;
        nonce: Hex;
        deadline: string;
        signature: Hex;
      }>("/api/x/attestation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, message: challenge.message, signature: walletSignature }),
      });
      setIsAttesting(false);
      writeContract({
        address: contractAddress,
        abi: thanksmaxxingAbi,
        functionName: "mintWithX",
        args: [
          text.trim(),
          BigInt(attestation.xUserId),
          attestation.username,
          attestation.profileImageUrl,
          attestation.nonce,
          BigInt(attestation.deadline),
          attestation.signature,
        ],
        value: mintPrice,
        chainId: targetChain.id,
      });
    } catch (error) {
      setIsAttesting(false);
      setFlowError(error instanceof Error ? error.message : "Could not verify your X and wallet connection.");
    }
  }

  const mintCount = nextId && nextId > 0n ? (nextId - 1n).toString() : "0";

  return (
    <section className="mint-section" id="mint">
      <div className="mint-copy">
        <p className="eyebrow">Your card starts here</p>
        <h2>What are you grateful for?</h2>
        <p className="section-intro">
          Sign into X to add your real profile photo, then connect your wallet to mint. Your gratitude is stored on Base; the contract allows one card per wallet and X account.
        </p>

        <div className="mint-stats">
          <div><strong>{isConfigured ? mintCount : "—"}</strong><span>cards minted</span></div>
          <div>
            <strong>{priceLabel}</strong>
            {usdWorth ? <em className="mint-price-usd">{usdWorth}</em> : null}
            <span>one-time mint on Base</span>
          </div>
        </div>

        <div className="wallet-panel">
          <span className="wallet-label">01 · YOUR BASE WALLET</span>
          <WalletButton />
        </div>

        <form className="mint-form" onSubmit={submit}>
          <label>02 · YOUR X ACCOUNT</label>
          {isLoadingX ? (
            <p className="x-profile-status">Checking X sign-in…</p>
          ) : xProfile ? (
            <div className="x-connected-card">
              <Image src={xProfile.profileImageUrl} alt="" width={44} height={44} unoptimized />
              <span><strong>@{xProfile.username}</strong><small>Verified by signing into X</small></span>
              <a className="text-link" href="/api/auth/x/logout">Change</a>
            </div>
          ) : (
            <button
              className="button button-secondary x-connect-button"
              disabled={isLoadingX}
              onClick={() => window.location.assign(new URL("/api/auth/x/start", window.location.origin).toString())}
              type="button"
            >
              Connect your X account
            </button>
          )}

          {xProfile && xAccountMinted ? (
            <p className="inline-error">This X account has already minted its one card.</p>
          ) : null}

          <label htmlFor="gratitude-text">03 · I’M GRATEFUL FOR…</label>
          <textarea
            autoComplete="off"
            id="gratitude-text"
            maxLength={600}
            onChange={(event) => setText(event.target.value)}
            placeholder="the people who show up"
            rows={3}
            value={text}
          />
          <div className="input-meta">
            <span>Saved onchain · max 600 bytes</span>
            <span className={textBytes > maxTextBytes ? "byte-count over-limit" : "byte-count"}>
              {textBytes}/{maxTextBytes} bytes
            </span>
          </div>

          {!isConfigured ? (
            <div className="notice">
              The preview is ready. Minting will open after the Base Sepolia contract is deployed.
            </div>
          ) : null}
          {walletMinted ? <p className="inline-error">This wallet has already minted its one card.</p> : null}
          {flowError ? <p className="inline-error">{flowError}</p> : null}

          {isWrongNetwork ? (
            <button className="button button-primary" disabled={isSwitching} onClick={() => switchChain({ chainId: targetChain.id })} type="button">
              {isSwitching ? "Switching…" : "Switch to " + targetChain.name}
            </button>
          ) : (
            <button
              className="button button-primary mint-button"
              disabled={
                !isConfigured || !xProfile || !isConnected || mintPrice === undefined || hasAlreadyMinted ||
                text.trim().length === 0 || textBytes === 0 || textBytes > maxTextBytes || isAttesting || isWriting || isConfirming
              }
              type="submit"
            >
              {isAttesting
                ? "Confirm wallet link…"
                : isWriting
                  ? "Confirm mint in your wallet…"
                  : isConfirming
                    ? "Confirming on Base…"
                    : "Mint my keepsake"}
              <span aria-hidden="true">↗</span>
            </button>
          )}

          <p className="mint-fineprint">
            One card per wallet and per X account. X sign-in proves account ownership; the contract enforces both limits.
          </p>
          {hash ? <p className="transaction-status">Transaction sent: {hash.slice(0, 10)}…</p> : null}
          {writeError || receiptError ? <p className="inline-error">{(writeError || receiptError)?.message}</p> : null}
        </form>
      </div>

      <div className="preview-column">
        <div className="preview-heading"><span>YOUR LIVE PREVIEW</span><span>01 / 01</span></div>
        <CardArt text={text} owner={address} xUsername={xProfile?.username} avatarUrl={xProfile?.profileImageUrl} preview />
        <p className="preview-caption">Live preview · Your connected X photo and wallet are added automatically.</p>
      </div>
    </section>
  );
}
