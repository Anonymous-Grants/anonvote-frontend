// Reconstructs a voter's Merkle authentication path from the round's public
// registration list, mirroring the incremental-tree algorithm in
// anonvote-contracts/contracts/anonvote/src/merkle.rs exactly (same
// left/right convention as circuits/anonvote/src/main.nr's `path_indices`).
//
// Registration is closed before voting opens (the contract freezes
// `merkle_root` the instant `open_voting` runs -- see the
// anonvote-contracts README), so by the time this runs the registration
// list is stable: it's safe to rebuild the whole tree from
// `GET /rounds/{id}/registrations` once and derive a path from it.
import { poseidonNode } from "./poseidon";
import { toBytes32Hex } from "./field";

/** Must match `MERKLE_DEPTH` in anonvote-contracts' `types.rs` and
 * `main.nr`. */
export const MERKLE_DEPTH = 8;

export interface MerklePath {
  root: string;
  siblings: string[];
  pathIndices: boolean[];
}

let zeroHashesPromise: Promise<string[]> | null = null;

/** `zero[0] = 0`, `zero[i+1] = Poseidon2(zero[i], zero[i])` -- the hash of
 * an empty subtree at each level, needed to pair a real node against an
 * as-yet-unregistered sibling. */
function zeroHashes(): Promise<string[]> {
  zeroHashesPromise ??= (async () => {
    const zeros = [toBytes32Hex("0")];
    for (let i = 0; i < MERKLE_DEPTH; i++) {
      const z = zeros[i];
      if (z === undefined) throw new Error("unreachable: zeroHashes index out of range");
      zeros.push(await poseidonNode(z, z));
    }
    return zeros;
  })();
  return zeroHashesPromise;
}

/** Builds every tree level from the leaf array up, needed so a sibling
 * lookup at any level (see `pathFor`) has a real value to pair against
 * rather than always falling back to the empty-subtree hash. */
async function buildLevels(leafHexes: string[]): Promise<string[][]> {
  const zeros = await zeroHashes();
  const levels: string[][] = [leafHexes];
  for (let level = 0; level < MERKLE_DEPTH; level++) {
    const cur = levels[level];
    if (cur === undefined) throw new Error("unreachable: level index out of range");
    const zero = zeros[level];
    if (zero === undefined) throw new Error("unreachable: zero-hash index out of range");
    const next: string[] = [];
    for (let i = 0; i < Math.ceil(cur.length / 2); i++) {
      const left = cur[2 * i];
      const right = cur[2 * i + 1] ?? zero;
      if (left === undefined) throw new Error("unreachable: missing left child while building level");
      next.push(await poseidonNode(left, right));
    }
    levels.push(next);
  }
  return levels;
}

/**
 * Computes the authentication path for `leafIndex` given every registered
 * commitment in the round, in `leaf_index` order (index `i` of
 * `commitmentsInLeafOrder` must be that leaf's actual `leaf_index` -- see
 * `useMerklePath`/callers, which sort `GET /rounds/{id}/registrations` by
 * `leaf_index` before calling this).
 */
export async function computeMerklePath(
  commitmentsInLeafOrder: string[],
  leafIndex: number,
): Promise<MerklePath> {
  if (leafIndex < 0 || leafIndex >= commitmentsInLeafOrder.length) {
    throw new Error(`leafIndex ${leafIndex} out of range for ${commitmentsInLeafOrder.length} registrations`);
  }
  const zeros = await zeroHashes();
  const levels = await buildLevels(commitmentsInLeafOrder);

  const siblings: string[] = [];
  const pathIndices: boolean[] = [];
  let idx = leafIndex;
  for (let level = 0; level < MERKLE_DEPTH; level++) {
    const isRight = idx % 2 === 1;
    const siblingIdx = isRight ? idx - 1 : idx + 1;
    const zero = zeros[level];
    if (zero === undefined) throw new Error("unreachable: zero-hash index out of range");
    const levelNodes = levels[level];
    if (levelNodes === undefined) throw new Error("unreachable: level index out of range");
    siblings.push(levelNodes[siblingIdx] ?? zero);
    pathIndices.push(isRight);
    idx = Math.floor(idx / 2);
  }

  const root = levels[MERKLE_DEPTH]?.[0];
  if (root === undefined) throw new Error("unreachable: root not computed");
  return { root, siblings, pathIndices };
}
