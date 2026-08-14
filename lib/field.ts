// Helpers for BN254 scalar-field elements represented as 0x-prefixed hex
// strings (32 bytes, big-endian) -- the convention used everywhere in this
// app: Poseidon2 circuit I/O (lib/poseidon.ts), Merkle paths (lib/merkle.ts),
// and anonvote-backend's `*_hex` request/response fields.

/** A cryptographically random 31-byte value, safely below the BN254 scalar
 * field modulus (~2^254) without needing modular reduction. This is a
 * voter's registration secret -- see lib/storage.ts for why it never leaves
 * this device. */
export function randomFieldHex(): string {
  const bytes = new Uint8Array(31);
  crypto.getRandomValues(bytes);
  return "0x" + bytesToHex(bytes).padStart(64, "0");
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const padded = clean.length % 2 === 0 ? clean : "0" + clean;
  const out = new Uint8Array(padded.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(padded.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Left-pads a hex field element to exactly 32 bytes (64 hex chars), the
 * fixed-width form the contract's `BytesN<32>` arguments and
 * anonvote-backend's `*_hex` fields expect. */
export function toBytes32Hex(hex: string): string {
  const clean = (hex.startsWith("0x") ? hex.slice(2) : hex).toLowerCase();
  if (clean.length > 64) throw new Error(`field element longer than 32 bytes: ${hex}`);
  return "0x" + clean.padStart(64, "0");
}
