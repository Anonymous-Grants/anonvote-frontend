"use client";

import { useState } from "react";
import { useSoroban } from "@/hooks/useSoroban";
import { hasSecret } from "@/lib/storage";
import { buildVoteWitness, castVoteViaBackendProving, castVoteWithProof, NoSecretError } from "@/lib/vote";
import { ApiError } from "@/lib/api";
import type { Proposal } from "@/lib/types";

type Mode = "own-proof" | "backend-proving";

export function VoteForm({ roundId, proposals }: { roundId: number; proposals: Proposal[] }) {
  const { wallet } = useSoroban();
  const [choice, setChoice] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("own-proof");
  const [nullifierHex, setNullifierHex] = useState("");
  const [proofA, setProofA] = useState("");
  const [proofB, setProofB] = useState("");
  const [proofC, setProofC] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedTxHash, setConfirmedTxHash] = useState<string | null | undefined>(undefined);

  const registered = wallet.address ? hasSecret(roundId, wallet.address) : false;

  async function submit() {
    if (choice === null) {
      setError("Pick a proposal first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let result;
      if (mode === "own-proof") {
        if (!nullifierHex || !proofA || !proofB || !proofC) {
          throw new Error("Fill in the nullifier and all three proof fields.");
        }
        result = await castVoteWithProof(roundId, choice, nullifierHex, {
          a: proofA,
          b: proofB,
          c: proofC,
        });
      } else {
        if (!wallet.address) throw new Error("Connect the wallet you registered with first.");
        const witness = await buildVoteWitness(roundId, wallet.address);
        result = await castVoteViaBackendProving(roundId, choice, witness);
      }
      setConfirmedTxHash(result.tx_hash);
    } catch (e) {
      setError(
        e instanceof NoSecretError
          ? e.message
          : e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : String(e),
      );
    } finally {
      setBusy(false);
    }
  }

  if (confirmedTxHash !== undefined) {
    return (
      <div className="card space-y-2 border-emerald-200 bg-emerald-50">
        <p className="text-sm font-medium text-emerald-800">Your vote was recorded.</p>
        <p className="text-xs text-emerald-700">
          This confirmation is private to this browser — nothing here (or anywhere else in this app)
          publishes which proposal you chose next to your address. The public ballot log only shows
          your vote&rsquo;s nullifier and choice, which can&rsquo;t be traced back to you.
        </p>
        {confirmedTxHash && (
          <p className="break-all text-xs text-emerald-700">Transaction: {confirmedTxHash}</p>
        )}
      </div>
    );
  }

  if (!registered) {
    return (
      <div className="card">
        <p className="text-sm text-ink/60">
          Register first (above), then come back here once voting is open.
        </p>
      </div>
    );
  }

  return (
    <div className="card space-y-5">
      <div>
        <h3 className="font-medium">Cast your vote</h3>
        <p className="mt-1 text-sm text-ink/60">
          No wallet signature needed for this step — that&rsquo;s the point. Pick a proposal and
          supply a proof that you&rsquo;re a registered voter who hasn&rsquo;t voted yet.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="label">Proposal</legend>
        {proposals.map((p) => (
          <label
            key={p.id}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-black/10 p-3 has-[:checked]:border-accent has-[:checked]:bg-accentSoft"
          >
            <input
              type="radio"
              name="choice"
              className="mt-1"
              checked={choice === p.choice_index}
              onChange={() => setChoice(p.choice_index)}
            />
            <span>
              <span className="block text-sm font-medium">{p.title}</span>
              {p.description && <span className="block text-xs text-ink/60">{p.description}</span>}
            </span>
          </label>
        ))}
      </fieldset>

      <div className="space-y-3 border-t border-black/10 pt-4">
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setMode("own-proof")}
            className={`rounded-full px-3 py-1 ${mode === "own-proof" ? "bg-ink text-white" : "bg-black/5 text-ink/70"}`}
          >
            I have a proof
          </button>
          <button
            type="button"
            onClick={() => setMode("backend-proving")}
            className={`rounded-full px-3 py-1 ${mode === "backend-proving" ? "bg-ink text-white" : "bg-black/5 text-ink/70"}`}
          >
            Generate via backend (less private)
          </button>
        </div>

        {mode === "own-proof" ? (
          <div className="space-y-2">
            <p className="text-xs text-ink/60">
              Fully private: generate this yourself from anonvote-contracts&rsquo; circuit (`nargo` +
              a Groth16 prover) and paste the result. Your secret never leaves your machine.
            </p>
            <div>
              <label className="label" htmlFor="nullifier">
                Nullifier (hex)
              </label>
              <input
                id="nullifier"
                className="input"
                value={nullifierHex}
                onChange={(e) => setNullifierHex(e.target.value)}
                placeholder="0x…"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input className="input" placeholder="proof.a" value={proofA} onChange={(e) => setProofA(e.target.value)} />
              <input className="input" placeholder="proof.b" value={proofB} onChange={(e) => setProofB(e.target.value)} />
              <input className="input" placeholder="proof.c" value={proofC} onChange={(e) => setProofC(e.target.value)} />
            </div>
          </div>
        ) : (
          <p className="text-xs text-amber-700">
            This sends your voting secret to anonvote-backend so it can generate the proof for you.
            The operator running that backend could, in principle, link your secret to this vote.
            Only use this against an operator you trust. See{" "}
            <a href="/results/transparency" className="underline">
              how anonymity works
            </a>
            .
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-accent" onClick={submit} disabled={busy}>
        {busy ? "Submitting…" : "Submit vote"}
      </button>
    </div>
  );
}
