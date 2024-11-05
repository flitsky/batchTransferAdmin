// Import ethers from Hardhat
const { ethers } = require("hardhat");

/**
 * Core.js Module
 * Provides core blockchain functions for account management, transaction checks, balance retrieval, and validation.
 */

let provider;
/**
 * Function: Initializes the provider.
 * @param {string} network - The name of the network (e.g., 'localhost', 'mainnet').
 */
function initProvider(network) {
  provider = ethers.provider; // Using Hardhat's provider
  console.log("Provider initialized for network:", network);
}

/**
 * Function: Generates a new random Ethereum account
 * @returns {object} - Returns the newly created random wallet object
 */
async function createRandomAccount() {
  try {
    const wallet = ethers.Wallet.createRandom(); // Step 1: Generate a random wallet
    console.log("New account created:", wallet.address);
    return wallet;
  } catch (error) {
    console.error("Error creating account:", error);
    throw error; // Step 2: Signal failure to the caller if an error occurs
  }
}

/**
 * Function: Generates a new clean Ethereum account
 * @returns {Promise<object>} - Returns the newly created clean wallet object
 */
async function createCleanAccount() {
  let account = await createRandomAccount();
  while (await hasTransactions(account.address)) {
    account = await createRandomAccount();
  }
  return account;
}

/**
 * Function: Checks if an account has existing transactions
 * @param {string} address - The Ethereum address to check
 * @returns {Promise<boolean>} - Returns true if transactions exist, false otherwise
 */
async function hasTransactions(address) {
  if (!provider) {
    console.warn(
      "Warning: Provider is not initialized. Please call initProvider() first."
    );
    return false;
  }

  try {
    const nonce = await provider.getTransactionCount(address); // Step 1: Get transaction count (nonce)
    return nonce > 0; // Step 2: Return true if nonce > 0
  } catch (error) {
    console.error("Error checking transactions:", error);
    return false;
  }
}

/**
 * Function: Retrieves balance of an account
 * @param {string} address - The Ethereum address to check
 * @returns {Promise<string>} - Returns the balance in Wei
 */
async function getAccountBalance(address) {
  if (!provider) {
    console.warn(
      "Warning: Provider is not initialized. Please call initProvider() first."
    );
    return null;
  }

  try {
    const balance = await provider.getBalance(address); // Step 1: Fetch balance
    console.log(
      "Account balance for",
      address,
      "is",
      balance.toString(),
      "Wei"
    );
    return balance.toString();
  } catch (error) {
    console.error("Error fetching balance:", error);
    throw error;
  }
}

/**
 * Function: Validates Ethereum address format
 * @param {string} address - The Ethereum address to validate
 * @returns {boolean} - Returns true if valid, false otherwise
 */
function isEOAValid(address) {
  const isValid = ethers.utils.isAddress(address); // Step 1: Validate address format
  console.log("Address", address, "is valid:", isValid);
  return isValid;
}

// Exporting core functions for external use
const core = {
  createRandomAccount,
  createCleanAccount,
  hasTransactions,
  getAccountBalance,
  isEOAValid,
  initProvider,
};

module.exports = core;
