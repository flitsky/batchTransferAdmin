const { ethers } = require("hardhat");
const provider = require("./provider.js").getProvider();

/**
 * @returns {ethers.Wallet} - Returns a random wallet
 */
async function createRandomWallet() {
  const wallet = ethers.Wallet.createRandom();
  console.log("New account created:", wallet.address);
  return wallet;
}

/**
 * @param {number} maxRetries - The maximum number of retries to create a clean wallet
 * @returns {ethers.Wallet} - Returns a clean wallet
 */
async function createCleanWallet(maxRetries = 3) {
  let wallet = await createRandomWallet();
  let retryCount = 0;
  while (await hasTransactions(wallet.address)) {
    if (++retryCount > maxRetries) {
      throw new Error(
        `Max retries reached (${maxRetries}). Unable to create a clean wallet.`
      );
    }
    console.warn(
      `Retry ${retryCount}: Wallet address ${wallet.address} has transactions. Generating a new wallet...`
    );
    wallet = await createRandomWallet();
  }
  return wallet;
}

/**
 * @param {string} address - The address to check for transactions
 * @returns {boolean} - Returns true if the address has transactions, false otherwise
 */
async function hasTransactions(address) {
  const nonce = await provider.getTransactionCount(address);
  return nonce > 0;
}

module.exports = {
  createRandomWallet,
  createCleanWallet,
  hasTransactions,
};
