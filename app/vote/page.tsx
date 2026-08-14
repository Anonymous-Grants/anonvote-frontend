"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Round } from "@/lib/types";
import { RoundCard } from "@/components/RoundCard";

export default function VoteIndexPage() {
  const [rounds, setRounds] = useState<Round[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listRounds()
      .then(setRounds)
      .catch((e) => setError(e instanceof ApiError ? e.message : String(e)));
  }, []);

  const open = rounds?.filter((r) => r.phase !== "finalized") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Open rounds</h1>
        <p className="mt-1 text-sm text-ink/60">
          Register once per round, then cast an anonymous vote once voting opens.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">Could not load rounds: {error}</p>}
      {!rounds && !error && <p className="text-sm text-ink/60">Loading…</p>}
      {rounds && open.length === 0 && <p className="text-sm text-ink/60">No open rounds right now.</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {open.map((r) => (
          <RoundCard key={r.id} round={r} href={`/vote/${r.id}`} />
        ))}
      </div>
    </div>
  );
}
