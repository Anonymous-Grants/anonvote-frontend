"use client";

import { useState } from "react";
import { useSoroban } from "@/hooks/useSoroban";
import { hasSecret } from "@/lib/storage";
import { ApiError } from "@/lib/api";

export function RegisterPanel({ roundId }: { roundId: number }) {
  const { wallet, connect, registerForRound } = useSoroban();
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">(
    wallet.address && hasSecret(roundId, wallet.address) ? "done" : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [leafIndex, setLeafIndex] = useState<number | null>(null);

  const alreadyRegistered = wallet.address ? hasSecret(roundId, wallet.address) : false;

  async function handleRegister() {
    setStatus("working");
    setError(null);
    try {
      if (!wallet.address) await connect();
      const result = await registerForRound(roundId);
      setLeafIndex(result.leaf_index);
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e));
    }
  }

  if (status === "done" || alreadyRegistered) {
    return (
      <div className="card border-emerald-200 bg-emerald-50">
        <p className="text-sm font-medium text-emerald-800">You&rsquo;re registered for this round.</p>
        <p className="mt-1 text-xs text-emerald-700">
          {leafIndex !== null
            ? `Anonymity-set position: leaf #${leafIndex}. `
            : ""}
          Your voting secret is saved in this browser only — you&rsquo;ll need this same browser (or
          the value exported from it) to vote. Come back once the organizer opens voting.
        </p>
      </div>
    );
  }

  return (
    <div className="card space-y-3">
      <div>
        <h3 className="font-medium">Register to vote</h3>
        <p className="mt-1 text-sm text-ink/60">
          Registering publishes a commitment to a secret this browser generates for you — not the
          secret itself. Your wallet signs this step, so it does reveal that{" "}
          <em>this address</em> registered. It does not reveal how you&rsquo;ll vote later — see{" "}
          <a href="/results/transparency" className="underline">
            how anonymity works
          </a>
          .
        </p>
      </div>
      {!wallet.address ? (
        <button className="btn-accent" onClick={() => connect().catch(() => {})}>
          Connect wallet
        </button>
      ) : (
        <button className="btn-accent" onClick={handleRegister} disabled={status === "working"}>
          {status === "working" ? "Registering…" : "Register with this wallet"}
        </button>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
