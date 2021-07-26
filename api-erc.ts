import axios from "axios"
import Web3 from "web3"
import * as fs from "fs"
import * as dotenv from 'dotenv'
dotenv.config()

//require('dotenv').config()


const APIKEYERC = process.env.API_KEY_ERC
const ENDPOINTERC = "https://api.etherscan.io/api"

const JSONStr = fs.readFileSync("./ERC20ABI.json","utf8")
const ERC20ABI = JSON.parse(JSONStr)

//const ERC20ABI = require("./ERC20ABI.json")

const rpcURL= `https://mainnet.infura.io/v3/${process.env.API_KEY_INFURA_MAINNET}`
const web3 = new Web3(rpcURL)


const adjustBalance = (balance, decimals) => {
    if  (balance.length <= decimals) {
        return "0." + 0 * (decimals - balance.length) + balance
    } else {
        return (balance.slice(0,-1*decimals) + "." + balance.slice(-1*decimals))
    }
}




async function getTokensERC20({address, detailed=false, metadata=false, startblock=0,existingERC20Tokens=[]}) {
    //get contract address of ERC20 tokens that the account currently hodl
    const tokens = await getHistoricalTokensERC20(address,metadata,startblock,existingERC20Tokens)

    if (!tokens.ERC20Tokens) {
        return tokens
    }
    const a = tokens.ERC20Tokens    


    let ERC20Tokens = []

    const getDataERC20 = async (contractAddress) => {
        try {
            let contract = new web3.eth.Contract(ERC20ABI, contractAddress)
            let balance = await contract.methods.balanceOf(address).call()
            if  (balance === '0') return;
            let decimals = await contract.methods.decimals().call()
            let adjustedBalance = adjustBalance(balance, decimals);
            if(detailed===false) {
                
                ERC20Tokens.push({"address":contractAddress, "balance": balance, "adjustedBalance": adjustedBalance})
            } else {
                let name = await contract.methods.name().call()
                let symbol = await contract.methods.symbol().call()
                let totalSupply = await contract.methods.totalSupply().call()
                ERC20Tokens.push({"address":contractAddress, "balance": balance, "adjustedBalance": adjustedBalance, "token": {"name":name,"symbol":symbol,"decimals":decimals,"totalSupply":totalSupply}})

            }
            return
        } catch (e) {
            return
        }
    }

    try{
        const ERC20Promise = await Promise.all(a.map(v => {
            return getDataERC20(v)
        }))

        const coinBalance = web3.utils.fromWei(await web3.eth.getBalance(address))

        return metadata ? {"ETHBalance":coinBalance, "ERC20Tokens" : ERC20Tokens, "numERC20Tokens": ERC20Tokens.length, "lastBlockNum" : tokens.lastBlockNum} : {"ERC20Tokens": ERC20Tokens,"numERC20Tokens": ERC20Tokens.length}

    } catch (e) {
        return e
    } 

}

async function getHistoricalTokensERC20Partition(address, metadata, startblock, existingERC20Tokens, endblock) {
    try {
        // 3 partitions
        let interval = (parseInt(endblock) - parseInt(startblock)) / 3
        let partition1 = [startblock, parseInt(startblock) + interval + '']
        let partition2 = [parseInt(startblock) + interval + 1 + '', parseInt(endblock) - interval + '']
        let partition3 = [parseInt(endblock) + interval + 1 + '', endblock]

        let ERC20Tokens = metadata ? {"ERC20Tokens":[...existingERC20Tokens], "lastBlockNum": endblock} : {"ERC20Tokens":[...existingERC20Tokens]}
        
        const promise1 = await axios.get(ENDPOINTERC + `?module=account&action=tokentx&address=${address}&startblock=${partition1[0]}&endblock=${partition1[1]}&sort=asc&apikey=${APIKEYERC}`)
                    .then(res => {
                        const {result} = res.data

                        if(Array.isArray(result)) {
                            ERC20Tokens.ERC20Tokens.push(...new Set(result.filter(item => item.tokenName!=='').map(item => item.contractAddress)))
                        }
                    })
        
        const promise2 = await axios.get(ENDPOINTERC + `?module=account&action=tokentx&address=${address}&startblock=${partition2[0]}&endblock=${partition2[1]}&sort=asc&apikey=${APIKEYERC}`)
                    .then(res => {
                        const {result} = res.data

                        if(Array.isArray(result)) {
                            ERC20Tokens.ERC20Tokens.push(...new Set(result.filter(item => item.tokenName!=='').map(item => item.contractAddress)))
                        }
                    })
                    
        const promise3 = await axios.get(ENDPOINTERC + `?module=account&action=tokentx&address=${address}&startblock=${partition3[0]}&endblock=${partition3[1]}&sort=asc&apikey=${APIKEYERC}`)
                    .then(res => {
                        const {result} = res.data

                        if(Array.isArray(result)) {
                            ERC20Tokens.ERC20Tokens.push(...new Set(result.filter(item => item.tokenName!=='').map(item => item.contractAddress)))
                        }
                    })
        
        return ERC20Tokens
    } catch(e) {
        return e
    }
}

async function getHistoricalTokensERC20(address, metadata=false, startblock=0, existingERC20Tokens=[]) {
    //get contract address of every ERC20 and ERC721 tokens the account has ever interacted with
    try {
        const ERC20Tokens = await axios.get(ENDPOINTERC + `?module=account&action=tokentx&address=${address}&startblock=${startblock}&endblock=999999999&sort=asc&apikey=${APIKEYERC}`)
                    .then(res => {
                        const {result} = res.data
                        let tokens = [...existingERC20Tokens]
                        let lastBlockNum = result[result.length-1].blockNumber

                        if (result.length == 10000) {
                            return getHistoricalTokensERC20Partition(address,metadata,startblock,existingERC20Tokens,lastBlockNum)
                        }

                        if(Array.isArray(result)) {
                            tokens = [...new Set(result.filter(item => item.tokenName!=='').map(item => item.contractAddress))]
                        }
                        if(metadata) {
                            return {"ERC20Tokens":tokens, "lastBlockNum": lastBlockNum}
                        }
                        return {"ERC20Tokens": tokens}
                    })
        
        return ERC20Tokens
    } catch (e) {
        return e
    }
    
}

export {
    getTokensERC20,
    getHistoricalTokensERC20
}

