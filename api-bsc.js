var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from "axios";
import Web3 from "web3";
import * as dotenv from 'dotenv';
dotenv.config();
import adjustBalance from "./helpers/adjust-balance.js";
import * as fs from "fs";
const APIKEYBSC = process.env.API_KEY_BSC;
const ENDPOINTBSC = "https://api.bscscan.com/api";
const JSONStr = fs.readFileSync("./BEP20ABI.json", "utf8");
const BEP20ABI = JSON.parse(JSONStr);
const rpcURL = "https://bsc-dataseed1.binance.org";
const web3 = new Web3(rpcURL);
function getTokensBEP20({ address, detailed = false, metadata = false, startblock = 0, existingBEP20Tokens = [] }) {
    return __awaiter(this, void 0, void 0, function* () {
        //get contract address of BEP20 tokens that the account currently hodl
        const tokens = yield getHistoricalTokensBEP20(address, metadata, startblock, existingBEP20Tokens);
        if (!tokens.BEP20Tokens) {
            return tokens;
        }
        const a = tokens.BEP20Tokens;
        let BEP20Tokens = [];
        const getDataBEP20 = (contractAddress) => __awaiter(this, void 0, void 0, function* () {
            try {
                let contract = new web3.eth.Contract(BEP20ABI, contractAddress);
                let balance = yield contract.methods.balanceOf(address).call();
                if (balance === '0')
                    return;
                let decimals = yield contract.methods.decimals().call();
                let adjustedBalance = adjustBalance(balance, decimals);
                if (detailed === false) {
                    BEP20Tokens.push({ "address": contractAddress, "balance": balance, "adjustedBalance": adjustedBalance });
                }
                else {
                    let name = yield contract.methods.name().call();
                    let symbol = yield contract.methods.symbol().call();
                    let totalSupply = yield contract.methods.totalSupply().call();
                    BEP20Tokens.push({ "address": contractAddress, "balance": balance, "adjustedBalance": adjustedBalance, "token": { "name": name, "symbol": symbol, "decimals": decimals, "totalSupply": totalSupply } });
                }
                return;
            }
            catch (e) {
                return;
            }
        });
        try {
            const BEP20Promise = yield Promise.all(a.map(v => {
                return getDataBEP20(v);
            }));
            const coinBalance = web3.utils.fromWei(yield web3.eth.getBalance(address));
            return metadata ? { "BNBBalance": coinBalance, "BEP20Tokens": BEP20Tokens, "numBEP20Tokens": BEP20Tokens.length, "lastBlockNum": tokens.lastBlockNum } : { "BEP20Tokens": BEP20Tokens, "numBEP20Tokens": BEP20Tokens.length };
        }
        catch (e) {
            return e;
        }
    });
}
function getHistoricalTokensBEP20Partition(address, metadata, startblock, existingBEP20Tokens, endblock) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 3 partitions
            let interval = (parseInt(endblock) - parseInt(startblock)) / 3;
            let partition1 = [startblock, parseInt(startblock) + interval + ''];
            let partition2 = [parseInt(startblock) + interval + 1 + '', parseInt(endblock) - interval + ''];
            let partition3 = [parseInt(endblock) + interval + 1 + '', endblock];
            let BEP20Tokens = metadata ? { "BEP20Tokens": [...existingBEP20Tokens], "lastBlockNum": endblock } : { "BEP20Tokens": [...existingBEP20Tokens] };
            const promise1 = yield axios.get(ENDPOINTBSC + `?module=account&action=tokentx&address=${address}&startblock=${partition1[0]}&endblock=${partition1[1]}&sort=asc&apikey=${APIKEYBSC}`)
                .then(res => {
                const { result } = res.data;
                if (Array.isArray(result)) {
                    BEP20Tokens.BEP20Tokens.push(...new Set(result.filter(item => item.tokenName !== '').map(item => item.contractAddress)));
                }
            });
            const promise2 = yield axios.get(ENDPOINTBSC + `?module=account&action=tokentx&address=${address}&startblock=${partition2[0]}&endblock=${partition2[1]}&sort=asc&apikey=${APIKEYBSC}`)
                .then(res => {
                const { result } = res.data;
                if (Array.isArray(result)) {
                    BEP20Tokens.BEP20Tokens.push(...new Set(result.filter(item => item.tokenName !== '').map(item => item.contractAddress)));
                }
            });
            const promise3 = yield axios.get(ENDPOINTBSC + `?module=account&action=tokentx&address=${address}&startblock=${partition3[0]}&endblock=${partition3[1]}&sort=asc&apikey=${APIKEYBSC}`)
                .then(res => {
                const { result } = res.data;
                if (Array.isArray(result)) {
                    BEP20Tokens.BEP20Tokens.push(...new Set(result.filter(item => item.tokenName !== '').map(item => item.contractAddress)));
                }
            });
            return BEP20Tokens;
        }
        catch (e) {
            return e;
        }
    });
}
function getHistoricalTokensBEP20(address, metadata = false, startblock = 0, existingBEP20Tokens = []) {
    return __awaiter(this, void 0, void 0, function* () {
        //get contract address of every BEP20 and BEP721 tokens the account has ever interacted with
        try {
            const BEP20Tokens = yield axios.get(ENDPOINTBSC + `?module=account&action=tokentx&address=${address}&startblock=${startblock}&endblock=999999999&sort=asc&apikey=${APIKEYBSC}`)
                .then(res => {
                const { result } = res.data;
                let tokens = [...existingBEP20Tokens];
                let lastBlockNum = result[result.length - 1].blockNumber;
                if (result.length == 10000) {
                    return getHistoricalTokensBEP20Partition(address, metadata, startblock, existingBEP20Tokens, lastBlockNum);
                }
                if (Array.isArray(result)) {
                    tokens = [...new Set(result.filter(item => item.tokenName !== '').map(item => item.contractAddress))];
                }
                if (metadata) {
                    return { "BEP20Tokens": tokens, "lastBlockNum": lastBlockNum };
                }
                return { "BEP20Tokens": tokens };
            });
            return BEP20Tokens;
        }
        catch (e) {
            return e;
        }
    });
}
export { getTokensBEP20, getHistoricalTokensBEP20 };
