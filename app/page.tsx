import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">Anonymous grant voting for Stellar</h1>
        <p className="max-w-2xl text-ink/70">
          AnonVote runs grant and RetroPGF rounds where the tally is fully public but no one — not
          even the people running the round — can tell who voted for what. Register once with your
          wallet, then vote with a zero-knowledge proof instead of a signature.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/vote" className="btn-accent">
            Browse open rounds
          </Link>
          <Link href="/results" className="btn-secondary">
            See live results
          </Link>
          <Link href="/results/transparency" className="btn-secondary">
            How anonymity works
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <h2 className="font-medium">1. Register</h2>
          <p className="mt-1 text-sm text-ink/70">
            Connect your wallet and register for a round. This is public — your address joins the
            round&rsquo;s anonymity set — but it doesn&rsquo;t say how you&rsquo;ll vote.
          </p>
        </div>
        <div className="card">
          <h2 className="font-medium">2. Vote</h2>
          <p className="mt-1 text-sm text-ink/70">
            Casting a vote needs no wallet signature at all — a zero-knowledge proof shows you&rsquo;re
            a registered voter who hasn&rsquo;t voted yet, without saying which registrant you are.
          </p>
        </div>
        <div className="card">
          <h2 className="font-medium">3. Verify</h2>
          <p className="mt-1 text-sm text-ink/70">
            Every ballot is public and the tally is live. Anyone can recount it independently — see
            the results page.
          </p>
        </div>
      </section>
    </div>
  );
}
