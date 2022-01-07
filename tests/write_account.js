"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const anchor = __importStar(require("@project-serum/anchor"));
const anchor_1 = require("@project-serum/anchor");
const writeAccount = anchor.workspace.WriteAccount;
const writeAccountProgram = writeAccount;
class WriteAccountWrapper {
    constructor(provider) {
        this.provider = provider;
    }
    createAccount(space) {
        return __awaiter(this, void 0, void 0, function* () {
            const newAccount = anchor_1.web3.Keypair.generate();
            const createTx = new anchor_1.web3.Transaction().add(anchor_1.web3.SystemProgram.createAccount({
                fromPubkey: this.provider.wallet.publicKey,
                newAccountPubkey: newAccount.publicKey,
                programId: WriteAccountWrapper.programId,
                lamports: yield this.provider.connection.getMinimumBalanceForRentExemption(space),
                space,
            }));
            yield this.provider.send(createTx, [newAccount]);
            return newAccount;
        });
    }
    store(account, offset, input) {
        return __awaiter(this, void 0, void 0, function* () {
            yield writeAccountProgram.rpc.write(offset, input, {
                accounts: {
                    target: account.publicKey
                },
                signers: [account]
            });
        });
    }
}
WriteAccountWrapper.programId = writeAccount.programId;
describe('write_account', () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.Provider.env());
    const provider = anchor.Provider.local();
    const writeAccountWrapper = new WriteAccountWrapper(provider);
    it("Write Pyth Data", () => __awaiter(void 0, void 0, void 0, function* () {
        const pythPrice = anchor_1.web3.Keypair.generate();
        yield writeAccountWrapper.store(pythPrice, new anchor.BN(10), Buffer.from([]));
    }));
});
