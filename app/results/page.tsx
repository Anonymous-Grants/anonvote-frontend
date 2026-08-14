"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Round } from "@/lib/types";
import { RoundCard } from "@/components/RoundCard";

export default function ResultsIndexPage() {
  const [rounds, setRounds] = useState<Round[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listRounds()
      .then(setRounds)
      .catch((e) => setError(e instanceof ApiError ? e.message : String(e)));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Results</h1>
        <p className="mt-1 text-sm text-ink/60">
          Live tallies for open rounds, and final results for past ones. Every number here is
          re-derivable by anyone directly from the chain.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">Could not load rounds: {error}</p>}
      {!rounds && !error && <p className="text-sm text-ink/60">Loading…</p>}
      {rounds && rounds.length === 0 && <p className="text-sm text-ink/60">No rounds yet.</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {rounds?.map((r) => (
          <RoundCard key={r.id} round={r} href={`/results/${r.id}`} />
        ))}
      </div>
    </div>
  );
}
