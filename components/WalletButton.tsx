"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useAccount, useConnect, useDisconnect, type Connector } from "wagmi";

function shortAddress(address: string) {
  return address.slice(0, 6) + "…" + address.slice(-4);
}

function visibleConnectors(connectors: readonly Connector[]) {
  const hasNamedInjected = connectors.some(
    (c) => c.id !== "injected" && c.id !== "coinbaseWalletSDK",
  );
  const seen = new Set<string>();
  return connectors.filter((connector) => {
    if (connector.id === "injected" && hasNamedInjected) return false;
    const key = connector.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function WalletButton() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const walletOptions = useMemo(() => visibleConnectors(connectors), [connectors]);

  if (isReconnecting) {
    return <span className="wallet-state">Reconnecting wallet…</span>;
  }

  if (isConnected && address) {
    return (
      <div className="wallet-connected">
        <span className="wallet-dot" aria-hidden="true" />
        <span className="wallet-address">{shortAddress(address)}</span>
        <button className="wallet-disconnect" onClick={() => disconnect()} type="button">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      {walletOptions.map((connector) => {
        const label = connector.id === "injected" ? "Browser Wallet" : connector.name;
        return (
          <button
            className="button button-connect"
            disabled={isConnecting || isPending}
            key={connector.uid}
            onClick={() => connect({ connector })}
            type="button"
          >
            {connector.icon ? (
              <Image className="wallet-icon" src={connector.icon} alt="" width={16} height={16} unoptimized />
            ) : null}
            <span>{isConnecting || isPending ? "Connecting…" : label}</span>
          </button>
        );
      })}
      {error ? <p className="inline-error">{error.message}</p> : null}
    </div>
  );
}
