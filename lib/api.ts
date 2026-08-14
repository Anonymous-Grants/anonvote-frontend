// Thin fetch wrapper around anonvote-backend's REST API. No caching, no
// state -- every call is a plain request against the live backend, which is
// itself either reading live from the chain (tally, registrations) or
// relaying a call to it (register, votes, round admin actions).
import type {
  Payout,
  PayoutResult,
  Proof,
  Round,
  RoundWithProposals,
  Tally,
  VoterRegistration,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (typeof body?.error === "string") message = body.error;
    } catch {
      // non-JSON error body; fall back to statusText
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// --- Rounds -----------------------------------------------------------

export interface CreateProposalInput {
  title: string;
  description?: string;
  payout_address: string;
}

export interface CreateRoundInput {
  title: string;
  payout_pool_stroops?: number;
  proposals: CreateProposalInput[];
}

export const api = {
  listRounds: () => request<Round[]>("/rounds"),

  createRound: (input: CreateRoundInput) =>
    request<RoundWithProposals>("/rounds", { method: "POST", body: JSON.stringify(input) }),

  getRound: (roundId: number) => request<RoundWithProposals>(`/rounds/${roundId}`),

  setEligibility: (roundId: number, voters: string[], eligible = true) =>
    request<{ round_id: number; updated: string[]; failed: { voter: string; error: string }[] }>(
      `/rounds/${roundId}/eligibility`,
      { method: "POST", body: JSON.stringify({ voters, eligible }) },
    ),

  openVoting: (roundId: number) => request<Round>(`/rounds/${roundId}/open`, { method: "POST" }),

  finalizeRound: (roundId: number) => request<Tally>(`/rounds/${roundId}/finalize`, { method: "POST" }),

  getTally: (roundId: number) => request<Tally>(`/rounds/${roundId}/tally`),

  getRegistrations: (roundId: number) =>
    request<VoterRegistration[]>(`/rounds/${roundId}/registrations`),

  listPayouts: (roundId: number) => request<Payout[]>(`/rounds/${roundId}/payouts`),

  // --- Voters -----------------------------------------------------------

  registerVoter: (input: {
    round_id: number;
    voter: string;
    commitment_hex: string;
    signed_xdr: string;
  }) =>
    request<{
      round_id: number;
      voter: string;
      leaf_index: number;
      commitment_hex: string;
      tx_hash: string | null;
    }>("/voters/register", { method: "POST", body: JSON.stringify(input) }),

  // --- Votes --------------------------------------------------------------

  castVoteWithProof: (input: { round_id: number; choice: number; nullifier_hex: string; proof: Proof }) =>
    request<{ round_id: number; choice: number; nullifier_hex: string; tx_hash: string | null }>(
      "/votes",
      { method: "POST", body: JSON.stringify(input) },
    ),

  castVoteWithWitness: (input: {
    round_id: number;
    choice: number;
    nullifier_hex: string;
    witness: { secret: string; merkle_path: string[]; path_indices: boolean[] };
  }) =>
    request<{ round_id: number; choice: number; nullifier_hex: string; tx_hash: string | null }>(
      "/votes",
      { method: "POST", body: JSON.stringify(input) },
    ),

  // --- Payouts ------------------------------------------------------------

  executePayouts: (roundId: number) =>
    request<{ round_id: number; payout_pool_stroops: number; payouts: PayoutResult[] }>(
      "/payouts/execute",
      { method: "POST", body: JSON.stringify({ round_id: roundId }) },
    ),
};
