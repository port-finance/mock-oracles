import * as anchor from '@project-serum/anchor';
import {Keypair, PublicKey, Transaction} from "@solana/web3.js"

// const writeAccountProgram = writeAccount as anchor.Program<WriteAccount>;
class WriteAccountWrapper {
  static readonly programId = writeAccount.programId;
  public readonly PYTH_PRICE_ACCOUNT_SIZE = 3312;
  public readonly SWITCHBOARD_OPTIMIZED_SIZE = 105;

  provider: anchor.Provider;

  constructor(provider: anchor.Provider) {
    this.provider = provider;
  }

  async createAccount(space: number): Promise<Keypair> {
    const newAccount = Keypair.generate();
    const createTx = new Transaction().add(
      SystemProgram.createAccount({
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