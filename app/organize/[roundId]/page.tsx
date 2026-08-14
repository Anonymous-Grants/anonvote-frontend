"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { RoundWithProposals } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";
import { RoundAdminPanel } from "@/components/RoundAdminPanel";

export default function OrganizeRoundPage() {
  const params = useParams<{ roundId: string }>();
  const roundId = Number(params.roundId);
  const [round, setRound] = useState<RoundWithProposals | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    api
      .getRound(roundId)
      .then(setRound)
      .catch((e) => setError(e instanceof ApiError ? e.message : String(e)));
  }, [roundId]);

  useEffect(refresh, [refresh]);

  if (error) return <p className="text-sm text-red-600">Could not load round: {error}</p>;
  if (!round) return <p className="text-sm text-ink/60">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ink/50">Round #{round.id}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{round.title}</h1>
        </div>
        <StatusPill phase={round.phase} />
      </div>

      <div className="card">
        <h2 className="mb-2 font-medium">Proposals</h2>
        <ul className="space-y-1 text-sm">
          {round.proposals.map((p) => (
            <li key={p.id} className="flex justify-between border-b border-black/5 py-1 last:border-0">
              <span>
                #{p.choice_index} — {p.title}
              </span>
              <span className="font-mono text-xs text-ink/50">{p.payout_address}</span>
            </li>
          ))}
        </ul>
      </div>

      <RoundAdminPanel round={round} onChanged={refresh} />
    </div>
  );
}
