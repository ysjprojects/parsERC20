"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const web3_1 = __importDefault(require("web3"));
require('dotenv').config();
const APIKEYERC = process.env.API_KEY_ERC;
const ENDPOINTERC = "https://api.etherscan.io/api";
const ERC20ABI = require("./ERC20ABI.json");
const rpcURL = `https://mainnet.infura.io/v3/${process.env.API_KEY_INFURA_MAINNET}`;
const web3 = new web3_1.default(rpcURL);
const adjustBalance = (balance, decimals) => {
    if (balance.length <= decimals) {
        return "0." + 0 * (decimals - balance.length) + balance;
    }
    else {
        return (balance.slice(0, -1 * decimals) + "." + balance.slice(-1 * decimals));
    }
};
function getTokensERC20({ address, detailed = false, metadata = false, startblock = 0, existingERC20Tokens = [] }) {
    return __awaiter(this, void 0, void 0, function* () {
        //get contract address of ERC20 tokens that the account currently hodl
        const tokens = yield getHistoricalTokensERC20(address, metadata, startblock, existingERC20Tokens);
        if (!tokens.ERC20Tokens) {
            return tokens;
        }
        const a = tokens.ERC20Tokens;
        let ERC20Tokens = [];
        const getDataERC20 = (contractAddress) => __awaiter(this, void 0, void 0, function* () {
            try {
                let contract = new web3.eth.Contract(ERC20ABI, contractAddress);
                let balance = yield contract.methods.balanceOf(address).call();
                if (balance === '0')
                    return;
                let decimals = yield contract.methods.decimals().call();
                let adjustedBalance = adjustBalance(balance, decimals);
                if (detailed === false) {
                    ERC20Tokens.push({ "address": contractAddress, "balance": balance, "adjustedBalance": adjustedBalance });
                }
                else {
                    let name = yield contract.methods.name().call();
                    let symbol = yield contract.methods.symbol().call();
                    let totalSupply = yield contract.methods.totalSupply().call();
                    ERC20Tokens.push({ "address": contractAddress, "balance": balance, "adjustedBalance": adjustedBalance, "token": { "name": name, "symbol": symbol, "decimals": decimals, "totalSupply": totalSupply } });
                }
                return;
            }
            catch (e) {
                return;
            }
        });
        try {
            const ERC20Promise = yield Promise.all(a.map(v => {
                return getDataERC20(v);
            }));
            const coinBalance = web3.utils.fromWei(yield web3.eth.getBalance(address));
            return metadata ? { "ETHBalance": coinBalance, "ERC20Tokens": ERC20Tokens, "numERC20Tokens": ERC20Tokens.length, "lastBlockNum": tokens.lastBlockNum } : { "ERC20Tokens": ERC20Tokens, "numERC20Tokens": ERC20Tokens.length };
        }
        catch (e) {
            return e;
        }
    });
}
function getHistoricalTokensERC20Partition(address, metadata, startblock, existingERC20Tokens, endblock) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 3 partitions
            let interval = (parseInt(endblock) - parseInt(startblock)) / 3;
            let partition1 = [startblock, parseInt(startblock) + interval + ''];
            let partition2 = [parseInt(startblock) + interval + 1 + '', parseInt(endblock) - interval + ''];
            let partition3 = [parseInt(endblock) + interval + 1 + '', endblock];
            let ERC20Tokens = metadata ? { "ERC20Tokens": [...existingERC20Tokens], "lastBlockNum": endblock } : { "ERC20Tokens": [...existingERC20Tokens] };
            const promise1 = yield axios_1.default.get(ENDPOINTERC + `?module=account&action=tokentx&address=${address}&startblock=${partition1[0]}&endblock=${partition1[1]}&sort=asc&apikey=${APIKEYERC}`)
                .then(res => {
                const { result } = res.data;
                if (Array.isArray(result)) {
                    ERC20Tokens.ERC20Tokens.push(...new Set(result.filter(item => item.tokenName !== '').map(item => item.contractAddress)));
                }
            });
            const promise2 = yield axios_1.default.get(ENDPOINTERC + `?module=account&action=tokentx&address=${address}&startblock=${partition2[0]}&endblock=${partition2[1]}&sort=asc&apikey=${APIKEYERC}`)
                .then(res => {
                const { result } = res.data;
                if (Array.isArray(result)) {
                    ERC20Tokens.ERC20Tokens.push(...new Set(result.filter(item => item.tokenName !== '').map(item => item.contractAddress)));
                }
            });
            const promise3 = yield axios_1.default.get(ENDPOINTERC + `?module=account&action=tokentx&address=${address}&startblock=${partition3[0]}&endblock=${partition3[1]}&sort=asc&apikey=${APIKEYERC}`)
                .then(res => {
                const { result } = res.data;
                if (Array.isArray(result)) {
                    ERC20Tokens.ERC20Tokens.push(...new Set(result.filter(item => item.tokenName !== '').map(item => item.contractAddress)));
                }
            });
            return ERC20Tokens;
        }
        catch (e) {
            return e;
        }
    });
}
function getHistoricalTokensERC20(address, metadata = false, startblock = 0, existingERC20Tokens = []) {
    return __awaiter(this, void 0, void 0, function* () {
        //get contract address of every ERC20 and ERC721 tokens the account has ever interacted with
        try {
            const ERC20Tokens = yield axios_1.default.get(ENDPOINTERC + `?module=account&action=tokentx&address=${address}&startblock=${startblock}&endblock=999999999&sort=asc&apikey=${APIKEYERC}`)
                .then(res => {
                const { result } = res.data;
                let tokens = [...existingERC20Tokens];
                let lastBlockNum = result[result.length - 1].blockNumber;
                if (result.length == 10000) {
                    return getHistoricalTokensERC20Partition(address, metadata, startblock, existingERC20Tokens, lastBlockNum);
                }
                if (Array.isArray(result)) {
                    tokens = [...new Set(result.filter(item => item.tokenName !== '').map(item => item.contractAddress))];
                }
                if (metadata) {
                    return { "ERC20Tokens": tokens, "lastBlockNum": lastBlockNum };
                }
                return { "ERC20Tokens": tokens };
            });
            return ERC20Tokens;
        }
        catch (e) {
            return e;
        }
    });
}
exports.default = {
    getTokensERC20,
    getHistoricalTokensERC20
};
