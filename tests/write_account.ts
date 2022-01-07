import * as anchor from '@project-serum/anchor';
import { WriteAccount } from '../target/types/write_account';
import { web3 as w3 } from "@project-serum/anchor";
import {parsePriceData} from "@pythnetwork/client";
import {assert} from "chai";

const writeAccount = anchor.workspace.WriteAccount;
const writeAccountProgram = writeAccount as anchor.Program<WriteAccount>;
class WriteAccountWrapper {
  static readonly programId = writeAccount.programId;
  public readonly PYTH_PRICE_ACCOUNT_SIZE = 3312;
  provider: anchor.Provider;

  constructor(provider: anchor.Provider) {
    this.provider = provider;
  }

  async createAccount(space: number): Promise<w3.Keypair> {
    const newAccount = w3.Keypair.generate();
    const createTx = new w3.Transaction().add(
      w3.SystemProgram.createAccount({
        fromPubkey: this.provider.wallet.publicKey,
        newAccountPubkey: newAccount.publicKey,
        programId: WriteAccountWrapper.programId,
        lamports:
          await this.provider.connection.getMinimumBalanceForRentExemption(
            space,
          ),
        space,
      }),
    );

    await this.provider.send(createTx, [newAccount]);

    return newAccount;
  }

  async store(account: w3.Keypair, offset: anchor.BN, input: Buffer) {
    await writeAccountProgram.rpc.write(
      offset, input,
      {
        accounts: {
          target: account.publicKey
        },
        signers: [account]
      }
    );
  }

  async writePythPrice(account: w3.Keypair, price: anchor.BN, expo: anchor.BN, slot: anchor.BN) {
    await writeAccountProgram.rpc.writePythPrice(
      price, expo, slot,
      {
        accounts: {
          target: account.publicKey
        },
        signers: [account]
      }
    )
  }
}
describe('write_account', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.Provider.local();
  const writeAccountWrapper = new WriteAccountWrapper(provider);
  it(
    "Write Pyth Data", async () => {
      const pythPrice = await writeAccountWrapper.createAccount(writeAccountWrapper.PYTH_PRICE_ACCOUNT_SIZE);
      const price = 10;
      const expo = 0;
      const slot = 10
      await writeAccountWrapper.writePythPrice(pythPrice, new anchor.BN(price), new anchor.BN(expo), new anchor.BN(slot) )
      const pythData = await provider.connection.getAccountInfo(pythPrice.publicKey);
      const pythPriceRecord = parsePriceData(pythData.data);
      assert(pythPriceRecord.price === price)
      assert(pythPriceRecord.exponent === expo)
      assert(pythPriceRecord.validSlot.toString() === slot.toString())
    }
  )
});
