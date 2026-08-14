// Poseidon2(left, right) -- the 2-to-1 hash used for both purposes
// `anonvote-contracts` needs a pairwise hash for:
//   - Merkle tree node hashing (`hash_node` in `contracts/anonvote/src/merkle.rs`,
//     `node = Poseidon2::hash([node, sibling], 2)` in the voting circuit), and
//   - the vote nullifier itself (`Poseidon2::hash([secret, round_id], 2)`).
//
// Same rationale as `circuits/hash1`: run the real hash construction via
// `@noir-lang/noir_js` in the browser rather than reimplementing Poseidon2 in
// TypeScript. The frontend uses this to (a) recompute a voter's Merkle
// authentication path from the round's public registration list before
// voting, and (b) derive the nullifier it submits with a vote -- both without
// the underlying secret ever leaving the browser.
use poseidon::poseidon2::Poseidon2;

fn main(left: Field, right: Field) -> pub Field {
    Poseidon2::hash([left, right], 2)
}
