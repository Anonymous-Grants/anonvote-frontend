// Mirrors anonvote-backend's JSON shapes exactly (field names included --
// the backend doesn't rename anything, so these match its Rust structs in
// src/models.rs 1:1). Keep the two in sync by hand; there's no shared schema
// between the repos.

export type RoundPhase = "registration" | "voting" | "finalized";

export interface Round {
  id: number;
  contract_id: string;
  admin: string;
  title: string;
  num_choices: number;
  phase: RoundPhase;
  payout_pool_stroops: number;
  create_round_tx_hash: string | null;
  created_at: string;
  voting_opened_at: string | null;
  finalized_at: string | null;
}

export interface Proposal {
  id: string;
  round_id: number;
  choice_index: number;
  title: string;
  description: string | null;
  payout_address: string;
  created_at: string;
}

export interface RoundWithProposals extends Round {
  proposals: Proposal[];
}

export interface VoterRegistration {
  id: string;
  round_id: number;
  voter_address: string;
  leaf_index: number;
  commitment_hex: string;
  register_tx_hash: string;
  registered_at: string;
}

export interface ChoiceTally {
  choice_index: number;
  proposal_title: string;
  payout_address: string;
  votes: number;
}

export interface Tally {
  round_id: number;
  // On-chain phase names are capitalized ("Registration"/"Voting"/
  // "Finalized") since this one is read straight from the contract's spec
  // rather than this backend's own `rounds.phase` column.
  phase: string;
  registered_count: number;
  choices: ChoiceTally[];
  total_votes: number;
}

export interface Payout {
  id: string;
  round_id: number;
  proposal_id: string;
  amount_stroops: number;
  vote_share_bps: number;
  status: "pending" | "submitted" | "confirmed" | "failed";
  payout_tx_hash: string | null;
  error: string | null;
  created_at: string;
  executed_at: string | null;
}

export interface PayoutResult {
  proposal_id: string;
  choice_index: number;
  payout_address: string;
  votes: number;
  vote_share_bps: number;
  amount_stroops: number;
  status: string;
  tx_hash: string | null;
  error: string | null;
}

export interface Proof {
  a: string;
  b: string;
  c: string;
}

export interface ApiErrorBody {
  error: string;
}
