// Poseidon2(secret) -- the 1-to-1 hash a `register` commitment must equal.
//
// This is *not* a proof circuit: it has no private/public split and nothing
// is hidden by running it. It exists purely so the frontend can compute
// `commitment = Poseidon2::hash([secret], 1)` in the browser via
// `@noir-lang/noir_js` executing this compiled circuit's ACIR, guaranteeing
// bit-identical output to `anonvote-contracts/circuits/anonvote/src/main.nr`'s
// `leaf` computation and `contracts/anonvote/src/merkle.rs`'s tree hashing --
// without reimplementing Poseidon2 by hand in TypeScript (a real permutation
// with large hardcoded round-constant tables; worth avoiding a second,
// unverified implementation of).
//
// `secret` never leaves the browser: this only ever runs locally, and the
// backend never sees it (see the frontend README's "how anonymity works"
// section for why that matters).
use poseidon::poseidon2::Poseidon2;

fn main(secret: Field) -> pub Field {
    Poseidon2::hash([secret], 1)
}
