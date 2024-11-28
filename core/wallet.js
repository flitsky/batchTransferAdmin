const { ethers } = require("hardhat");
const provider = require("./provider.js").getProvider();
const fs = require("fs");
const csv = require("fast-csv");

let walletMap = new Map();

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

/**
 * Reads wallet information from a CSV file, validates it, and stores it in a map.
 * @param {string} filePath - The path to the CSV file.
 * @returns {Promise<void>}
 */
async function readWalletsFromCSV(filePath) {
  const seenAddresses = new Set();
  let totalObjects = 0;
  let validObjects = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true }))
      .on("data", (row) => {
        totalObjects++;
        const { address, privateKey } = row;
        try {
          const wallet = new ethers.Wallet(privateKey);
          if (wallet.address.toLowerCase() === address.toLowerCase()) {
            if (seenAddresses.has(address.toLowerCase())) {
              console.warn(`Duplicate address found in CSV: ${address}`);
            } else {
              seenAddresses.add(address.toLowerCase());
              walletMap.set(address, wallet);
              validObjects++;
            }
          } else {
            console.warn(`Address mismatch for private key: ${privateKey}`);
          }
        } catch (error) {
          console.error(`Invalid private key: ${privateKey}`, error);
        }
      })
      .on("end", () => {
        console.log(`Total objects processed: ${totalObjects}`);
        console.log(`Valid objects loaded: ${validObjects}`);
        resolve();
      })
      .on("error", reject);
  });
}

/**
 * Retrieves the private key for a given address.
 * @param {string} address - The Ethereum address.
 * @returns {string|null} - Returns the private key if found, otherwise null.
 */
function getPvKeyFromAddress(address) {
  return walletMap.get(address) || null;
}

/**
 * Returns the size of the wallet map.
 * @returns {number} - The number of wallets in the map.
 */
function getWalletMapSize() {
  return walletMap.size;
}

/**
 * Retrieves the wallet object for a given address.
 * @param {string} address - The Ethereum address.
 * @returns {ethers.Wallet|null} - Returns the wallet object if found, otherwise null.
 */
function getWalletFromAddress(address) {
  return walletMap.get(address) || null;
}

/**
 * Returns the wallet map.
 * @returns {Map} - The map containing wallet objects.
 */
function getWalletMap() {
  return walletMap;
}

module.exports = {
  createRandomWallet,
  createCleanWallet,
  hasTransactions,
  readWalletsFromCSV,
  getPvKeyFromAddress,
  getWalletMapSize,
  getWalletFromAddress,
  getWalletMap,
};
