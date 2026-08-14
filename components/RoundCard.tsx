import Link from "next/link";
import type { Round } from "@/lib/types";
import { StatusPill } from "./StatusPill";

export function RoundCard({ round, href }: { round: Round; href: string }) {
  return (
    <Link href={href} className="card block transition hover:border-accent/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ink/50">Round #{round.id}</p>
          <h3 className="font-medium">{round.title}</h3>
        </div>
        <StatusPill phase={round.phase} />
      </div>
      <p className="mt-2 text-sm text-ink/60">{round.num_choices} proposals</p>
    </Link>
  );
}
