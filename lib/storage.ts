// Persists a voter's registration secret in this browser only --
// localStorage, namespaced per round + address, never sent anywhere. Losing
// it means losing the ability to vote in that round (there's nothing to
// recover it from: the whole point is that nothing else, including this
// app's own backend, ever sees it). See the README's "how anonymity works"
// section.
const PREFIX = "anonvote:secret:";

function key(roundId: number, voterAddress: string): string {
  return `${PREFIX}${roundId}:${voterAddress}`;
}

export function saveSecret(roundId: number, voterAddress: string, secretHex: string): void {
  window.localStorage.setItem(key(roundId, voterAddress), secretHex);
}

export function loadSecret(roundId: number, voterAddress: string): string | null {
  return window.localStorage.getItem(key(roundId, voterAddress));
}

export function hasSecret(roundId: number, voterAddress: string): boolean {
  return loadSecret(roundId, voterAddress) !== null;
}
