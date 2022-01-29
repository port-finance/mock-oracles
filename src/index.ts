import { Program, Provider } from "@project-serum/anchor";
import {
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import BN from "bn.js";
import { MockOraclesIDL, MockOraclesJSON } from "./idls/mock_oracles";
export interface OracleData {
  price?: BN;
  slot?: BN;
  expo?: number;
}
export class MockOraclesWrapper {
  public readonly PYTH_PRICE_ACCOUNT_SIZE = 3312;
  public readonly SWITCHBOARD_OPTIMIZED_SIZE = 105;

  private readonly program: Program<MockOraclesIDL>;

  constructor(provider: Provider, programAddress: PublicKey) {
    this.program = new Program(MockOraclesJSON, programAddress, provider);
  }

  async createAccount(space: number): Promise<Keypair> {
    const newAccount = Keypair.generate();
    const createTx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: this.program.provider.wallet.publicKey,
        newAccountPubkey: newAccount.publicKey,
        programId: this.program.programId,
        lamports:
          await this.program.provider.connection.getMinimumBalanceForRentExemption(
            space
          ),
        space,
      })
    );
    await this.program.provider.send(createTx, [newAccount]);

    return newAccount;
  }

  async store(account: Keypair, offset: BN, input: Buffer) {
    await this.program.rpc.write(offset, input, {
      accounts: {
        target: account.publicKey,
      },
      signers: [account],
    });
  }

  async writePythPrice(
    account: Keypair,
    { price = new BN(-1), slot = new BN(-1), expo = 0 }: OracleData
  ) {
    await this.program.rpc.writePythPrice(price, expo, slot, {
      accounts: {
        target: account.publicKey,
      },
      signers: [account],
    });
  }

  async writeSwitchboardPrice(
    account: Keypair,
    boardType: number,
    { price = new BN(-1), slot = new BN(-1), expo = 0 }: OracleData
  ) {
    await this.program.rpc.writeSwitchboardPrice(price, expo, slot, boardType, {
      accounts: {
        target: account.publicKey,
      },
      signers: [account],
    });
  }
}
