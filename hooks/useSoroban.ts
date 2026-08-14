"use client";

import { useCallback, useState } from "react";
import freighterApi from "@stellar/freighter-api";
import { api } from "@/lib/api";
import { poseidonLeaf } from "@/lib/poseidon";
import { randomFieldHex } from "@/lib/field";
import { saveSecret } from "@/lib/storage";
import { prepareRegisterTransaction } from "@/lib/soroban";

export interface WalletState {
  address: string | null;
  network: string | null;
  networkPassphrase: string | null;
}

/**
 * Wraps Freighter wallet connection and the one on-chain action a voter's
 * wallet actually needs to sign in this app: `register`. Casting a vote
 * (`cast_vote`) needs no wallet signature at all -- see
 * `components/VoteForm.tsx` and the README's anonymity explainer -- so this
 * hook has no "vote" method; it's registration-and-connection only.
 */
export function useSoroban() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    network: null,
    networkPassphrase: null,
  });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const connected = await freighterApi.isConnected();
      if (connected.error || !connected.isConnected) {
        throw new Error("Freighter extension not detected. Install it from freighter.app.");
      }
      const access = await freighterApi.requestAccess();
      if (access.error) throw new Error(access.error.message ?? String(access.error));
      const net = await freighterApi.getNetwork();
      if (net.error) throw new Error(net.error.message ?? String(net.error));
      setWallet({ address: access.address, network: net.network, networkPassphrase: net.networkPassphrase });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    // Freighter has no programmatic "revoke" call from a dApp; this just
    // clears local UI state. The extension's own permission grant is
    // managed by the user from the extension itself.
    setWallet({ address: null, network: null, networkPassphrase: null });
  }, []);

  /**
   * Registers `wallet.address` for `roundId`: generates a fresh secret
   * locally, derives its commitment (Poseidon2 hash, computed entirely in
   * this browser -- see lib/poseidon.ts), builds and simulates the
   * `register` call, has Freighter sign it, and relays the signed
   * transaction through the backend. The secret is saved to this browser's
   * localStorage only after the on-chain call succeeds, and is never sent
   * anywhere else.
   */
  const registerForRound = useCallback(
    async (roundId: number) => {
      if (!wallet.address) throw new Error("connect a wallet first");
      const address = wallet.address;

      const secretHex = randomFieldHex();
      const commitmentHex = await poseidonLeaf(secretHex);

      const unsignedXdr = await prepareRegisterTransaction(address, roundId, commitmentHex);
      const signed = await freighterApi.signTransaction(unsignedXdr, {
        address,
        networkPassphrase: wallet.networkPassphrase ?? undefined,
      });
      if (signed.error) throw new Error(signed.error.message ?? String(signed.error));

      const result = await api.registerVoter({
        round_id: roundId,
        voter: address,
        commitment_hex: commitmentHex,
        signed_xdr: signed.signedTxXdr,
      });

      saveSecret(roundId, address, secretHex);
      return result;
    },
    [wallet.address, wallet.networkPassphrase],
  );

  return { wallet, connecting, error, connect, disconnect, registerForRound };
}
