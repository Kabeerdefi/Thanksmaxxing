"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

function shortAddress(address: string) {
  return address.slice(0, 6) + "…" + address.slice(-4);
}

export function WalletButton() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

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
      {connectors.map((connector) => (
        <button
          className="button button-connect"
          disabled={isConnecting || isPending}
          key={connector.uid}
          onClick={() => connect({ connector })}
          type="button"
        >
          {isConnecting || isPending ? "Connecting…" : "Connect " + connector.name}
        </button>
      ))}
      {error ? <p className="inline-error">{error.message}</p> : null}
    </div>
  );
}
