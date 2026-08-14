"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Payout, Tally } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";
import { TallyBar } from "@/components/TallyBar";

export default function ResultsRoundPage() {
  const params = useParams<{ roundId: string }>();
  const roundId = Number(params.roundId);
  const [tally, setTally] = useState<Tally | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    api
      .getTally(roundId)
      .then(setTally)
      .catch((e) => setError(e instanceof ApiError ? e.message : String(e)));
    api.listPayouts(roundId).then(setPayouts).catch(() => {});
  }, [roundId]);

  useEffect(() => {
    refresh();
    // Live tally: poll every few seconds rather than caching, so this
    // never shows a stale count -- see anonvote-backend's README on why
    // GET /rounds/{id}/tally itself reads straight from the chain on every
    // call.
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  if (error) return <p className="text-sm text-red-600">Could not load tally: {error}</p>;
  if (!tally) return <p className="text-sm text-ink/60">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ink/50">Round #{tally.round_id}</p>
          <h1 className="text-2xl font-semibold tracking-tight">Live tally</h1>
        </div>
        <StatusPill phase={tally.phase} />
      </div>

      <div className="card space-y-4">
        <p className="text-sm text-ink/60">
          {tally.total_votes} vote{tally.total_votes === 1 ? "" : "s"} cast · {tally.registered_count}{" "}
          registered voter{tally.registered_count === 1 ? "" : "s"}
        </p>
        <div className="space-y-4">
          {tally.choices.map((c) => (
            <TallyBar key={c.choice_index} choice={c} totalVotes={tally.total_votes} />
          ))}
        </div>
      </div>

      {payouts.length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-medium">Payouts</h2>
          <ul className="space-y-2 text-sm">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between border-b border-black/5 pb-2 last:border-0">
                <span className="text-ink/70">{(p.vote_share_bps / 100).toFixed(1)}% share</span>
                <span className="font-medium">{(p.amount_stroops / 10_000_000).toLocaleString()} XLM</span>
                <span className="text-xs uppercase text-ink/50">{p.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
