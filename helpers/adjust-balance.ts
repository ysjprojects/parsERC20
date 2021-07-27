
const adjustBalance = (balance, decimals) => {
    if  (balance.length <= decimals) {
        return "0." + '0'.repeat((decimals - balance.length)) + balance
    } else {
        return (balance.slice(0,-1*decimals) + "." + balance.slice(-1*decimals))
    }
}

export default adjustBalance