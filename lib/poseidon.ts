// Client-side Poseidon2 hashing, via @noir-lang/noir_js executing the tiny
// compiled circuits in lib/circuits/. This is the privacy-critical piece of
// this app: it lets the browser compute a registration commitment and a
// vote nullifier from a secret without that secret (or anything derived
// from it in a way that could be inverted) ever being sent anywhere.
//
// Why run a circuit instead of a JS Poseidon2 library: Poseidon2's
// permutation (round constants, S-box, MDS matrix) is easy to get subtly
// wrong by hand, and this project already has a real, compiled
// implementation of the exact right parameterization (state width 4, rate
// 3) via the `noir-lang/poseidon` package -- the same one
// anonvote-contracts' Merkle tree and voting circuit use. Executing that
// compiled circuit's ACIR via noir_js's ACVM guarantees bit-identical
// output to the on-chain contract; a hand-rolled reimplementation would
// need its own from-scratch verification to earn the same trust. This was
// confirmed against the real anonvote-contracts circuit's reference values
// while building this app -- see the frontend README.
"use client";

import { Noir, type CompiledCircuit } from "@noir-lang/noir_js";
import hash1Circuit from "./circuits/hash1.json";
import hash2Circuit from "./circuits/hash2.json";
import { toBytes32Hex } from "./field";

let hash1: Noir | null = null;
let hash2: Noir | null = null;

function getHash1(): Noir {
  hash1 ??= new Noir(hash1Circuit as unknown as CompiledCircuit);
  return hash1;
}

function getHash2(): Noir {
  hash2 ??= new Noir(hash2Circuit as unknown as CompiledCircuit);
  return hash2;
}

/** `Poseidon2::hash([secret], 1)` -- the leaf a `register` commitment must
 * equal. */
export async function poseidonLeaf(secretHex: string): Promise<string> {
  const { returnValue } = await getHash1().execute({ secret: secretHex });
  return toBytes32Hex(returnValue as string);
}

/** `Poseidon2::hash([left, right], 2)` -- Merkle node hashing. */
export async function poseidonNode(leftHex: string, rightHex: string): Promise<string> {
  const { returnValue } = await getHash2().execute({ left: leftHex, right: rightHex });
  return toBytes32Hex(returnValue as string);
}

/** `Poseidon2::hash([secret, round_id], 2)` -- the nullifier `cast_vote`
 * checks hasn't already been spent in this round. */
export async function poseidonNullifier(secretHex: string, roundId: number): Promise<string> {
  const { returnValue } = await getHash2().execute({
    left: secretHex,
    right: "0x" + roundId.toString(16),
  });
  return toBytes32Hex(returnValue as string);
}
