"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { RoundWithProposals } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";
import { RegisterPanel } from "@/components/RegisterPanel";
import { VoteForm } from "@/components/VoteForm";
import Link from "next/link";

export default function VoteRoundPage() {
  const params = useParams<{ roundId: string }>();
  const roundId = Number(params.roundId);
  const [round, setRound] = useState<RoundWithProposals | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getRound(roundId)
      .then(setRound)
      .catch((e) => setError(e instanceof ApiError ? e.message : String(e)));
  }, [roundId]);

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

      {round.phase === "registration" && <RegisterPanel roundId={round.id} />}

      {round.phase === "voting" && (
        <>
          <RegisterPanel roundId={round.id} />
          <VoteForm roundId={round.id} proposals={round.proposals} />
        </>
      )}

      {round.phase === "finalized" && (
        <div className="card">
          <p className="text-sm text-ink/60">
            This round is finalized. See{" "}
            <Link href={`/results/${round.id}`} className="underline">
              its final results
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
