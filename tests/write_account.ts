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
  public readonly SWITCHBOARD_OPTIMIZED_SIZE = 105;

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

  async writeSwitchboardPrice(account: w3.Keypair, price: anchor.BN, expo: anchor.BN, slot: anchor.BN, boardType: number) {
    await writeAccountProgram.rpc.writeSwitchboardPrice(
      price, expo, slot, boardType,
      {
        accounts: {
          target: account.publicKey
        },
        signers: [account]
      }
    )
  }
}

async function loadZeroCopyAggregator(
  con: w3.Connection,
  pubkey: w3.PublicKey
): Promise<any> {
  let buf =
    (await con.getAccountInfo(pubkey))?.data.slice(1) ?? Buffer.from("");
  const parent = new w3.PublicKey(buf.slice(0, 32));
  buf = buf.slice(32);
  const numSuccess = buf.readInt32LE(0);
  buf = buf.slice(4);
  const numError = buf.readInt32LE(0);
  buf = buf.slice(4);
  const result = buf.readDoubleLE(0);
  buf = buf.slice(8);
  const roundOpenSlot = buf.readBigUInt64LE(0);
  buf = buf.slice(8);
  const roundOpenTimestamp = buf.readBigInt64LE(0);
  buf = buf.slice(8);
  const minResponse = buf.readDoubleLE(0);
  buf = buf.slice(8);
  const maxResponse = buf.readDoubleLE(0);
  buf = buf.slice(8);
  const decimalMantissa = new anchor.BN(buf.slice(0, 16), "le");
  buf = buf.slice(16);
  const decimalScale = buf.readBigUInt64LE(0);
  buf = buf.slice(8);
  return {
    parent,
    result: {
      numSuccess,
      numError,
      result,
      roundOpenSlot,
      roundOpenTimestamp,
      minResponse,
      maxResponse,
      decimal: {
        mantissa: decimalMantissa,
        scale: decimalScale,
      },
    },
  };
}


describe('write_account', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.Provider.local();
  const writeAccountWrapper = new WriteAccountWrapper(provider);
  it(
    "Write Pyth Data", async () => {
      const pythPriceKeypair = await writeAccountWrapper.createAccount(writeAccountWrapper.PYTH_PRICE_ACCOUNT_SIZE);
      const price = 10;
      const expo = 0;
      const slot = 10;
      await writeAccountWrapper.writePythPrice(pythPriceKeypair, new anchor.BN(price), new anchor.BN(expo), new anchor.BN(slot) )
      const pythData = await provider.connection.getAccountInfo(pythPriceKeypair.publicKey);
      const pythPriceRecord = parsePriceData(pythData.data);
      assert(pythPriceRecord.price === price)
      assert(pythPriceRecord.exponent === expo)
      assert(pythPriceRecord.validSlot.toString() === slot.toString())
    }
  )

  it(
    "Write SwitchBoard Data", async () => {
      const switchBoardKeypair = await writeAccountWrapper
        .createAccount(writeAccountWrapper.SWITCHBOARD_OPTIMIZED_SIZE);
      const price = 10;
      const expo = 0;
      const slot = 10;
      await writeAccountWrapper.writeSwitchboardPrice(switchBoardKeypair, new anchor.BN(price), new anchor.BN(expo), new anchor.BN(slot),1);
      const switchboardPrice = await loadZeroCopyAggregator(provider.connection, switchBoardKeypair.publicKey)
      assert(switchboardPrice.result.result.toString() === price.toString())
      assert(switchboardPrice.result.roundOpenSlot.toString() === slot.toString())
    }
  )
});
