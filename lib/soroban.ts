// Builds and prepares (simulates, so the required authorization entry gets
// recorded) the on-chain `register` invocation for a voter to sign with
// their own wallet. This module never signs anything itself -- see
// hooks/useSoroban.ts, which hands the prepared transaction to Freighter.
import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  nativeToScVal,
  rpc,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { hexToBytes } from "./field";

const RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";
const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID ?? "";

export function getServer(): rpc.Server {
  return new rpc.Server(RPC_URL);
}

export { NETWORK_PASSPHRASE, CONTRACT_ID };

/**
 * Builds `register(round_id, voter, commitment)` as a transaction from
 * `voterAddress`, and simulates it so the resulting XDR already carries the
 * `voter.require_auth()` authorization entry Freighter needs to sign --
 * signing an unsimulated invocation directly fails auth at submission time.
 * Returns XDR ready for `signTransaction`; nothing here touches a secret key.
 */
export async function prepareRegisterTransaction(
  voterAddress: string,
  roundId: number,
  commitmentHex: string,
): Promise<string> {
  if (!CONTRACT_ID) throw new Error("NEXT_PUBLIC_CONTRACT_ID is not configured");

  const server = getServer();
  const account = await server.getAccount(voterAddress);
  const contract = new Contract(CONTRACT_ID);

  const commitmentBytes = hexToBytes(commitmentHex);
  if (commitmentBytes.length !== 32) {
    throw new Error(`commitment must be 32 bytes, got ${commitmentBytes.length}`);
  }

  const tx = new TransactionBuilder(new Account(voterAddress, account.sequenceNumber()), {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "register",
        nativeToScVal(roundId, { type: "u64" }),
        new Address(voterAddress).toScVal(),
        nativeToScVal(Buffer.from(commitmentBytes), { type: "bytes" }),
      ),
    )
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(tx);
  return prepared.toXDR();
}
