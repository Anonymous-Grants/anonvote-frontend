"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Round } from "@/lib/types";
import { RoundCard } from "@/components/RoundCard";
import { CreateRoundForm } from "@/components/CreateRoundForm";

export default function OrganizePage() {
  const [rounds, setRounds] = useState<Round[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api
      .listRounds()
      .then(setRounds)
      .catch((e) => setError(e instanceof ApiError ? e.message : String(e)));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organize</h1>
          <p className="mt-1 max-w-xl text-sm text-ink/60">
            Create a round, curate eligibility, open and close voting, and trigger payouts. This
            page talks directly to anonvote-backend using its own operator identity — it doesn&rsquo;t
            require a wallet signature, since the backend is the round&rsquo;s on-chain admin. See
            the README before pointing this at a backend you don&rsquo;t control.
          </p>
        </div>
        <button className="btn-accent whitespace-nowrap" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "New round"}
        </button>
      </div>

      {showForm && <CreateRoundForm />}

      {error && <p className="text-sm text-red-600">Could not load rounds: {error}</p>}
      {!rounds && !error && <p className="text-sm text-ink/60">Loading…</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {rounds?.map((r) => (
          <RoundCard key={r.id} round={r} href={`/organize/${r.id}`} />
        ))}
      </div>
    </div>
  );
}
