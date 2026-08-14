"use client";

import { useSoroban } from "@/hooks/useSoroban";

function short(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function WalletButton() {
  const { wallet, connecting, error, connect, disconnect } = useSoroban();

  if (wallet.address) {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-accentSoft px-3 py-1.5 text-xs font-medium text-accent">
          {short(wallet.address)}
        </span>
        <button className="btn-secondary" onClick={disconnect}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button className="btn-accent" onClick={() => connect().catch(() => {})} disabled={connecting}>
        {connecting ? "Connecting…" : "Connect Freighter"}
      </button>
      {error && <span className="max-w-xs text-right text-xs text-red-600">{error}</span>}
    </div>
  );
}
