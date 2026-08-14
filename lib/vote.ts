// Assembles everything a vote needs except the actual Groth16 proof: the
// caller's Merkle authentication path (from the round's public registration
// list) and their nullifier for this round -- both derived from the local
// secret saved at registration, entirely client-side.
import { loadSecret } from "./storage";
import { computeMerklePath, type MerklePath } from "./merkle";
import { poseidonNullifier } from "./poseidon";
import { api } from "./api";
import type { VoterRegistration } from "./types";

export class NoSecretError extends Error {
  constructor(roundId: number) {
    super(
      `No registration secret found in this browser for round ${roundId}. ` +
        `You can only vote from the device/browser you registered with -- see the README.`,
    );
    this.name = "NoSecretError";
  }
}

export interface VoteWitness {
  secretHex: string;
  nullifierHex: string;
  merklePath: MerklePath;
  myRegistration: VoterRegistration;
}

/**
 * Gathers the private witness for a vote: this device's saved secret, this
 * round's full public registration list (to rebuild the Merkle tree), and
 * this voter's own path through it. Everything here either stays local
 * (`secretHex`) or is already public on-chain (the registration list,
 * `merklePath`).
 */
export async function buildVoteWitness(roundId: number, voterAddress: string): Promise<VoteWitness> {
  const secretHex = loadSecret(roundId, voterAddress);
  if (!secretHex) throw new NoSecretError(roundId);

  const registrations = await api.getRegistrations(roundId);
  const sorted = [...registrations].sort((a, b) => a.leaf_index - b.leaf_index);
  const myRegistration = sorted.find((r) => r.voter_address === voterAddress);
  if (!myRegistration) {
    throw new Error(`No registration found for ${voterAddress} in round ${roundId}`);
  }

  const commitments = sorted.map((r) => r.commitment_hex);
  const [merklePath, nullifierHex] = await Promise.all([
    computeMerklePath(commitments, myRegistration.leaf_index),
    poseidonNullifier(secretHex, roundId),
  ]);

  return { secretHex, nullifierHex, merklePath, myRegistration };
}

/**
 * Casts a vote by having anonvote-backend generate the proof server-side
 * from the raw witness. Convenience path, **not private from the backend
 * operator**: the operator's process sees `secretHex` for the moment this
 * request is in flight, and could in principle link it to `choice`. Only
 * use this against an operator you trust (e.g. your own local backend) --
 * see the README's "how anonymity works" section before wiring this into a
 * production deployment.
 */
export async function castVoteViaBackendProving(roundId: number, choice: number, witness: VoteWitness) {
  return api.castVoteWithWitness({
    round_id: roundId,
    choice,
    nullifier_hex: witness.nullifierHex,
    witness: {
      secret: witness.secretHex,
      merkle_path: witness.merklePath.siblings,
      path_indices: witness.merklePath.pathIndices,
    },
  });
}

/**
 * Casts a vote with a proof the caller already generated themselves (e.g.
 * via their own local `nargo`/Barretenberg run against
 * anonvote-contracts/circuits/anonvote -- see that repo's README). This is
 * the fully private path: nothing about the secret ever leaves the voter's
 * machine, at any point, to anyone.
 */
export async function castVoteWithProof(
  roundId: number,
  choice: number,
  nullifierHex: string,
  proof: { a: string; b: string; c: string },
) {
  return api.castVoteWithProof({ round_id: roundId, choice, nullifier_hex: nullifierHex, proof });
}
