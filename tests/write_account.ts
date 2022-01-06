import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { WriteAccount } from '../target/types/write_account';

describe('write_account', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.WriteAccount as Program<WriteAccount>;
});
