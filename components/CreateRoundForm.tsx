"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, type CreateProposalInput } from "@/lib/api";

const emptyProposal = (): CreateProposalInput => ({ title: "", description: "", payout_address: "" });

export function CreateRoundForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [payoutPoolXlm, setPayoutPoolXlm] = useState("");
  const [proposals, setProposals] = useState<CreateProposalInput[]>([emptyProposal(), emptyProposal()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateProposal(index: number, patch: Partial<CreateProposalInput>) {
    setProposals((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const cleaned = proposals
        .map((p) => ({ ...p, title: p.title.trim(), payout_address: p.payout_address.trim() }))
        .filter((p) => p.title && p.payout_address);
      if (cleaned.length === 0) throw new Error("Add at least one proposal.");
      const payoutPoolStroops = payoutPoolXlm ? Math.round(Number(payoutPoolXlm) * 10_000_000) : 0;

      const round = await api.createRound({
        title: title.trim(),
        payout_pool_stroops: payoutPoolStroops,
        proposals: cleaned,
      });
      router.push(`/organize/${round.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card space-y-5">
      <div>
        <label className="label" htmlFor="round-title">
          Round title
        </label>
        <input
          id="round-title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Q3 RetroPGF Round"
        />
      </div>

      <div>
        <label className="label" htmlFor="payout-pool">
          Payout pool (XLM)
        </label>
        <input
          id="payout-pool"
          className="input"
          type="number"
          min="0"
          value={payoutPoolXlm}
          onChange={(e) => setPayoutPoolXlm(e.target.value)}
          placeholder="0"
        />
        <p className="mt-1 text-xs text-ink/50">
          Split proportionally across proposals by vote share once the round is finalized.
        </p>
      </div>

      <div className="space-y-3">
        <p className="label">Proposals</p>
        {proposals.map((p, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-black/10 p-3 sm:grid-cols-2">
            <input
              className="input"
              placeholder="Proposal title"
              value={p.title}
              onChange={(e) => updateProposal(i, { title: e.target.value })}
            />
            <input
              className="input"
              placeholder="Payout address (G...)"
              value={p.payout_address}
              onChange={(e) => updateProposal(i, { payout_address: e.target.value })}
            />
            <input
              className="input sm:col-span-2"
              placeholder="Description (optional)"
              value={p.description}
              onChange={(e) => updateProposal(i, { description: e.target.value })}
            />
          </div>
        ))}
        <button type="button" className="btn-secondary" onClick={() => setProposals((prev) => [...prev, emptyProposal()])}>
          + Add proposal
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-accent" onClick={submit} disabled={busy || !title.trim()}>
        {busy ? "Creating…" : "Create round"}
      </button>
    </div>
  );
}
