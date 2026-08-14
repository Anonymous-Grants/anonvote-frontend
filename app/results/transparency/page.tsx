export default function TransparencyPage() {
  return (
    <article className="max-w-2xl space-y-6 text-sm leading-relaxed text-ink/80">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">How anonymity works here</h1>
        <p className="mt-2 text-sm text-ink/60">
          Written for someone reviewing this project, not just using it. No cryptography background
          assumed.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="font-medium text-ink">The short version</h2>
        <p>
          Every ballot cast in a round is public — anyone can see that a vote for &ldquo;Proposal
          A&rdquo; happened. What&rsquo;s hidden is <em>who</em> cast it. Not hidden from a
          third-party observer only — hidden from the round organizer, from this app&rsquo;s own
          backend, and from the smart contract itself. None of them ever learn which registered
          voter any given ballot came from.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium text-ink">What&rsquo;s public and what isn&rsquo;t</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left">
              <th className="py-2 pr-4">Public</th>
              <th className="py-2">Private</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black/5 align-top">
              <td className="py-2 pr-4">
                That your address <em>registered</em> for a round
              </td>
              <td className="py-2">Which ballot that registration later cast</td>
            </tr>
            <tr className="border-b border-black/5 align-top">
              <td className="py-2 pr-4">Every ballot&rsquo;s choice and running tally</td>
              <td className="py-2">Which voter cast any specific ballot</td>
            </tr>
            <tr className="align-top">
              <td className="py-2 pr-4">
                That <em>a</em> registered voter voted (via that ballot&rsquo;s nullifier)
              </td>
              <td className="py-2">
                <em>Which</em> registered voter it was
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          Registering is not anonymous — it&rsquo;s a normal signed transaction from your wallet.
          That&rsquo;s an intentional, disclosed trade-off (see &ldquo;why registration is
          public&rdquo; below): the anonymity guarantee covers the link between registering and
          voting, not registration itself.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium text-ink">The mechanism, in plain language</h2>
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <strong>Registering</strong> generates a random secret, entirely in your browser, and
            publishes only a one-way hash of it (a &ldquo;commitment&rdquo;). The secret itself
            never leaves your device. Every registered voter&rsquo;s commitment becomes a leaf in a
            tree structure (a Merkle tree) — think of it as a public list of hashes, one per
            registrant, with no names attached.
          </li>
          <li>
            <strong>Voting</strong> requires proving two things without saying which registrant you
            are: (a) &ldquo;my secret&rsquo;s commitment is <em>somewhere</em> in that tree&rdquo;,
            and (b) &ldquo;this is the first time I&rsquo;ve proven that for this round.&rdquo; Both
            are proven with a zero-knowledge proof — a piece of math that convinces the contract
            those two statements are true without revealing which leaf in the tree is yours.
          </li>
          <li>
            Double-voting is stopped by a <strong>nullifier</strong>: a value deterministically
            derived from your secret and the round (so voting twice always produces the identical
            nullifier), which the contract rejects the second time it sees it — again, without
            learning whose secret produced it.
          </li>
          <li>
            Casting a vote needs <strong>no wallet signature at all</strong>. The proof is the only
            authorization; anyone (this app, a relayer, a stranger) can submit it on your behalf,
            which is why the transaction that casts your vote carries no trace of your identity —
            there&rsquo;s nothing identifying to strip out, because it was never there.
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium text-ink">Why registration is public</h2>
        <p>
          Someone has to stop the same person from registering unlimited times (Sybil resistance).
          This project&rsquo;s answer is an eligibility list an organizer curates before
          registration opens — a badgeholder registry, a hackathon judge roster, whatever fits the
          round. Checking eligibility means checking a real address, so registration can&rsquo;t be
          anonymous without a different Sybil-resistance mechanism entirely. What matters is that
          this cost is paid once, at registration, and doesn&rsquo;t leak into voting.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium text-ink">
          The one place this app can quietly break its own guarantee
        </h2>
        <p>
          Generating the zero-knowledge proof requires your secret as an input, wherever it
          happens. This app defaults to generating it <strong>in your browser</strong>, where the
          secret never leaves your machine. It also offers a &ldquo;generate via backend&rdquo;
          convenience option for voters who&rsquo;d rather not run a local prover — but that mode
          sends your secret to anonvote-backend for that one request, and a backend operator who
          chose to log or inspect that request could link your secret to your vote. This isn&rsquo;t
          a bug to be fixed later; it&rsquo;s an inherent property of remote proving, and the UI
          labels that option accordingly. If you&rsquo;re reviewing this project for its anonymity
          properties, treat &ldquo;proof generated locally&rdquo; as the guarantee, and
          &ldquo;proof generated by a trusted backend&rdquo; as a documented, opt-in exception to
          it.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium text-ink">Verifying this yourself</h2>
        <p>
          Nothing above should be taken on faith. The contract, its Merkle tree and Groth16
          verifier, and the Noir circuit that defines the exact statement being proved all live in{" "}
          <code>anonvote-contracts</code>, with a full test suite covering registration, valid
          votes, double-vote rejection, and tally correctness. <code>anonvote-backend</code>&rsquo;s
          README documents exactly which of its endpoints can see a voter&rsquo;s secret (only{" "}
          <code>POST /votes</code> with a <code>witness</code> body — the convenience path above)
          and which never can.
        </p>
      </section>
    </article>
  );
}
