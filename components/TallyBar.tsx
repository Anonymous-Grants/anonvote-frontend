import type { ChoiceTally } from "@/lib/types";

export function TallyBar({ choice, totalVotes }: { choice: ChoiceTally; totalVotes: number }) {
  const pct = totalVotes > 0 ? Math.round((choice.votes / totalVotes) * 1000) / 10 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{choice.proposal_title}</span>
        <span className="text-ink/60">
          {choice.votes} vote{choice.votes === 1 ? "" : "s"} ({pct}%)
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/5">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
