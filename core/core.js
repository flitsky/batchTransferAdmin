const Web3 = require('web3');

async function hasTransactions(web3, address) {
    try {
        const nonce = await web3.eth.getTransactionCount(address);
        return nonce > 0; // nonce가 0보다 크면 트랜잭션을 생성한 적이 있음
    } catch (error) {
        console.error("Error fetching nonce:", error);
        return false;
    }
}

const core = {
    hasTransactions,
};

module.exports = core;
