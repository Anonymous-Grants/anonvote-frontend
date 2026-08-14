# anonvote-frontend

Next.js frontend for [AnonVote](../anonvote-contracts): register and vote
anonymously in Stellar grant / RetroPGF rounds, watch a live public tally,
and run rounds as an organizer — all against
[anonvote-backend](../anonvote-backend) and the
[AnonVote Soroban contract](../anonvote-contracts).

If you're reviewing this project for its anonymity properties specifically,
read [How anonymity works here](#how-anonymity-works-here) below (also
published in-app at `/results/transparency`) before anything else.

## Structure

```
app/
  vote/               browse open rounds, register, cast a vote
  results/             live/final tallies, and /transparency (the anonymity explainer)
  organize/            create a round, curate eligibility, open/close voting, trigger payouts
components/            RegisterPanel, VoteForm, RoundAdminPanel, CreateRoundForm, ...
hooks/useSoroban.ts     Freighter wallet connection + the register transaction flow
lib/
  api.ts                 anonvote-backend REST client
  soroban.ts              builds/simulates the register transaction for Freighter to sign
  poseidon.ts             client-side Poseidon2 hashing (see below)
  merkle.ts                rebuilds a voter's Merkle authentication path client-side
  vote.ts                   assembles a vote's witness (nullifier + Merkle path) from a saved secret
  storage.ts                 the one place a voter's secret is persisted (this browser's localStorage)
circuits/hash1, circuits/hash2   tiny Noir circuits lib/poseidon.ts runs client-side (source, for review)
lib/circuits/*.json              those two circuits, precompiled -- no `nargo` needed to build this app
```

## Setup

Requires Node 20+, [Freighter](https://freighter.app) installed in your
browser, and a running [anonvote-backend](../anonvote-backend) pointed at a
deployed, `initialize`d AnonVote contract.

```bash
npm install
cp .env.local.example .env.local   # fill in NEXT_PUBLIC_CONTRACT_ID etc.
npm run dev
```

None of the `.env.local` values are secret — the backend URL, contract id,
RPC URL, and network passphrase are all public by nature. Nothing sensitive
(a voter's secret, a vote's proof) ever passes through an env var or this
app's own server; see below.

## How anonymity works here

*(Also published in-app at `/results/transparency`, written for a general
audience. This section is the same content aimed at someone reading code.)*

**What's public:** that an address registered for a round; every ballot's
choice and the running tally; that *some* registered voter cast a given
ballot (via its nullifier). **What's private:** which registered voter cast
any specific ballot.

The mechanism (full detail in `anonvote-contracts`' README):

1. **Registering** (`hooks/useSoroban.ts::registerForRound`) generates a
   random secret in the browser (`lib/field.ts::randomFieldHex`) and
   publishes only `Poseidon2(secret)` — a commitment — as a leaf in an
   on-chain Merkle tree. The secret is saved to this browser's
   `localStorage` (`lib/storage.ts`) and is never sent anywhere else, not
   even to `anonvote-backend`. This step *is* a normal signed transaction
   from the voter's wallet, so it does reveal that this address registered.

2. **Voting** needs a zero-knowledge proof of "I know a secret whose
   commitment is *some* leaf in this round's tree, and this nullifier is
   that secret's nullifier for this round" — without saying which leaf.
   `cast_vote` needs **no wallet signature**: the proof is the only
   authorization, so the transaction that casts a vote carries nothing
   identifying to begin with.

3. Building that proof needs: the secret (from `localStorage`), the
   voter's Merkle authentication path, and the nullifier. `lib/vote.ts`
   assembles the path by fetching every registration for the round
   (`GET /rounds/{id}/registrations` — already public on-chain) and
   rebuilding the tree client-side (`lib/merkle.ts`, mirroring
   `contracts/anonvote/src/merkle.rs`'s algorithm exactly), and derives the
   nullifier the same way. Both the path-rebuilding and the nullifier need
   Poseidon2 hashing, which happens **client-side, in the browser, via a
   real compiled Noir circuit** (`lib/poseidon.ts`) — see below.

### Why Poseidon2 runs through an actual Noir circuit, not a JS reimplementation

Poseidon2's permutation (round constants, S-box, MDS matrix) is easy to get
subtly wrong by hand, and a wrong hash here wouldn't fail loudly — it'd just
produce a proof that silently doesn't match the contract's Merkle root.
Rather than reimplementing it, `lib/poseidon.ts` runs the actual
`noir-lang/poseidon` package (the same one `anonvote-contracts` uses) via
[`@noir-lang/noir_js`](https://www.npmjs.com/package/@noir-lang/noir_js)
executing two tiny precompiled circuits (`circuits/hash1`, `circuits/hash2`
— source included, artifacts precompiled into `lib/circuits/*.json` so the
app doesn't need `nargo` to build). This was confirmed to produce
bit-identical output to `anonvote-contracts`' own `nargo test` reference
values while building this app, for both the 1-to-1 hash (commitments) and
the 2-to-1 hash (Merkle nodes and nullifiers).

### The one place this app can quietly break its own guarantee

Generating the actual Groth16 *proof* (not just the Poseidon2 hashing above)
needs the secret as an input, wherever it runs. This app offers two paths
in `components/VoteForm.tsx`:

- **"I have a proof"** (default): paste in a proof you generated yourself
  (e.g. via `anonvote-contracts`' circuit with your own local `nargo` +
  Groth16 prover). Fully private — the secret never leaves your machine, at
  any point, to anyone.
- **"Generate via backend"**: sends the raw witness (including the secret)
  to `anonvote-backend`'s `POST /votes` for server-side proving. This is a
  **documented trust exception**, not a bug: whoever operates that backend
  sees your secret for that request and could in principle link it to your
  choice. The UI labels this accordingly. This app does not implement
  full client-side Groth16 proving (via e.g. `@aztec/bb.js`) — Barretenberg's
  current JS bindings and CLI center on UltraHonk, and this project's
  on-chain verifier is specifically a Groth16 pairing check, so getting that
  combination working correctly needs more version-specific validation than
  this build includes. Treat "generated via backend" as convenience, not
  privacy, until that changes.

### Why registration is public

Something has to stop unlimited re-registration (Sybil resistance), and
checking eligibility means checking a real address. AnonVote's answer is an
eligibility list an organizer curates before registration opens (see
`components/RoundAdminPanel.tsx`'s eligibility step) — that cost is paid
once, at registration, and doesn't leak into voting.

## The organizer view's trust model

`app/organize` calls `anonvote-backend` directly (`POST /rounds`,
`.../eligibility`, `.../open`, `.../finalize`, `POST /payouts/execute`) with
no wallet signature, because the backend's own operator identity is the
on-chain `round.admin` for every round it creates — see
`anonvote-backend`'s README. This demo has no auth layer in front of those
endpoints: anyone who can reach your backend can call them. Put it behind
your own access control before running a real round.

## License

Licensed under the [Apache License, Version 2.0](LICENSE).
