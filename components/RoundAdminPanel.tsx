"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { PayoutResult, RoundWithProposals } from "@/lib/types";

function errMsg(e: unknown): string {
  return e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e);
}

export function RoundAdminPanel({
  round,
  onChanged,
}: {
  round: RoundWithProposals;
  onChanged: () => void;
}) {
  const [voterList, setVoterList] = useState("");
  const [eligBusy, setEligBusy] = useState(false);
  const [eligResult, setEligResult] = useState<{ updated: string[]; failed: { voter: string; error: string }[] } | null>(
    null,
  );
  const [busy, setBusy] = useState<"open" | "finalize" | "payout" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payoutResults, setPayoutResults] = useState<PayoutResult[] | null>(null);

  async function submitEligibility() {
    const voters = voterList
      .split(/[\s,]+/)
      .map((v) => v.trim())
      .filter(Boolean);
    if (voters.length === 0) return;
    setEligBusy(true);
    setError(null);
    try {
      const result = await api.setEligibility(round.id, voters, true);
      setEligResult(result);
      setVoterList("");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setEligBusy(false);
    }
  }

  async function openVoting() {
    setBusy("open");
    setError(null);
    try {
      await api.openVoting(round.id);
      onChanged();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  async function finalize() {
    setBusy("finalize");
    setError(null);
    try {
      await api.finalizeRound(round.id);
      onChanged();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  async function executePayouts() {
    setBusy("payout");
    setError(null);
    try {
      const result = await api.executePayouts(round.id);
      setPayoutResults(result.payouts);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {round.phase === "registration" && (
        <div className="card space-y-3">
          <div>
            <h3 className="font-medium">Eligibility</h3>
            <p className="mt-1 text-sm text-ink/60">
              Paste Stellar addresses (one per line, or comma-separated) to allow them to register.
              This is this round&rsquo;s Sybil-resistance step — plug in whatever eligibility list
              makes sense (a badgeholder registry, a judge roster, ...).
            </p>
          </div>
          <textarea
            className="input h-28 font-mono text-xs"
            value={voterList}
            onChange={(e) => setVoterList(e.target.value)}
            placeholder="GABC...&#10;GDEF..."
          />
          <button className="btn-secondary" onClick={submitEligibility} disabled={eligBusy}>
            {eligBusy ? "Updating…" : "Mark eligible"}
          </button>
          {eligResult && (
            <p className="text-xs text-ink/60">
              {eligResult.updated.length} updated
              {eligResult.failed.length > 0 && `, ${eligResult.failed.length} failed`}.
            </p>
          )}

          <div className="border-t border-black/10 pt-3">
            <button className="btn-primary" onClick={openVoting} disabled={busy !== null}>
              {busy === "open" ? "Opening…" : "Close registration & open voting"}
            </button>
          </div>
        </div>
      )}

      {round.phase === "voting" && (
        <div className="card">
          <h3 className="font-medium">Voting is open</h3>
          <p className="mt-1 text-sm text-ink/60">
            Registration is closed and the anonymity set is frozen. Close voting once the round is
            over.
          </p>
          <button className="btn-primary mt-3" onClick={finalize} disabled={busy !== null}>
            {busy === "finalize" ? "Finalizing…" : "Close voting & finalize"}
          </button>
        </div>
      )}

      {round.phase === "finalized" && (
        <div className="card space-y-3">
          <h3 className="font-medium">Payouts</h3>
          <p className="text-sm text-ink/60">
            Splits {(round.payout_pool_stroops / 10_000_000).toLocaleString()} XLM across proposals
            in proportion to their final vote share. Safe to click more than once — a round&rsquo;s
            payouts only ever execute once.
          </p>
          <button className="btn-primary" onClick={executePayouts} disabled={busy !== null || round.payout_pool_stroops === 0}>
            {busy === "payout" ? "Executing…" : "Execute payouts"}
          </button>
          {round.payout_pool_stroops === 0 && (
            <p className="text-xs text-ink/50">This round has no payout pool configured.</p>
          )}
          {payoutResults && (
            <ul className="space-y-1 text-xs">
              {payoutResults.map((p) => (
                <li key={p.proposal_id} className="flex justify-between border-b border-black/5 py-1 last:border-0">
                  <span>{p.payout_address}</span>
                  <span>
                    {(p.amount_stroops / 10_000_000).toLocaleString()} XLM · {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
