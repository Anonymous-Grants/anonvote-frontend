const STYLES: Record<string, string> = {
  registration: "bg-amber-100 text-amber-800",
  Registration: "bg-amber-100 text-amber-800",
  voting: "bg-emerald-100 text-emerald-800",
  Voting: "bg-emerald-100 text-emerald-800",
  finalized: "bg-slate-200 text-slate-700",
  Finalized: "bg-slate-200 text-slate-700",
};

export function StatusPill({ phase }: { phase: string }) {
  const style = STYLES[phase] ?? "bg-slate-200 text-slate-700";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {phase[0]?.toUpperCase() + phase.slice(1)}
    </span>
  );
}
