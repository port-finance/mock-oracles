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
const client_1 = require("@pythnetwork/client");
const chai_1 = require("chai");
const writeAccount = anchor.workspace.WriteAccount;
const writeAccountProgram = writeAccount;
class WriteAccountWrapper {
    constructor(provider) {
        this.PYTH_PRICE_ACCOUNT_SIZE = 3312;
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
            anchor.Program.fetchIdl();
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
    writePythPrice(account, price, expo, slot) {
        return __awaiter(this, void 0, void 0, function* () {
            yield writeAccountProgram.rpc.writePythPrice(price, expo, slot, {
                accounts: {
                    target: account.publicKey
                },
                signers: [account]
            });
        });
    }
    writeSwitchboardPrice(account, price, expo, slot, boardType) {
        return __awaiter(this, void 0, void 0, function* () {
            yield writeAccountProgram.rpc.writeSwitchboardPrice(price, expo, slot, boardType, {
                accounts: {
                    target: account.publicKey
                },
                signers: [account]
            });
        });
    }
}
WriteAccountWrapper.programId = writeAccount.programId;
function loadZeroCopyAggregator(con, pubkey) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        let buf = (_b = (_a = (yield con.getAccountInfo(pubkey))) === null || _a === void 0 ? void 0 : _a.data.slice(1)) !== null && _b !== void 0 ? _b : Buffer.from("");
        const parent = new anchor_1.web3.PublicKey(buf.slice(0, 32));
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
    });
}
describe('write_account', () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.Provider.env());
    const provider = anchor.Provider.local();
    const writeAccountWrapper = new WriteAccountWrapper(provider);
    it("Write Pyth Data", () => __awaiter(void 0, void 0, void 0, function* () {
        const pythPriceKeypair = yield writeAccountWrapper.createAccount(writeAccountWrapper.PYTH_PRICE_ACCOUNT_SIZE);
        const price = 10;
        const expo = 0;
        const slot = 10;
        yield writeAccountWrapper.writePythPrice(pythPriceKeypair, new anchor.BN(price), new anchor.BN(expo), new anchor.BN(slot));
        const pythData = yield provider.connection.getAccountInfo(pythPriceKeypair.publicKey);
        const pythPriceRecord = (0, client_1.parsePriceData)(pythData.data);
        (0, chai_1.assert)(pythPriceRecord.price === price);
        (0, chai_1.assert)(pythPriceRecord.exponent === expo);
        (0, chai_1.assert)(pythPriceRecord.validSlot.toString() === slot.toString());
    }));
    it("Write SwitchBoard Data", () => __awaiter(void 0, void 0, void 0, function* () {
        const switchBoardKeypair = yield writeAccountWrapper.createAccount(writeAccountWrapper.PYTH_PRICE_ACCOUNT_SIZE);
        const price = 10;
        const expo = 0;
        const slot = 10;
        yield writeAccountWrapper.writeSwitchboardPrice(switchBoardKeypair, new anchor.BN(price), new anchor.BN(expo), new anchor.BN(slot), 1);
        const switchboardPrice = yield loadZeroCopyAggregator(provider.connection, switchBoardKeypair.publicKey);
        console.log(switchboardPrice.result);
    }));
});
