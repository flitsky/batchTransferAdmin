const Web3 = require("web3");

/**
 * Core.js Module
 * Provides core blockchain functions for account management, transaction checks, balance retrieval, and validation.
 */

let web3Instance;
/**
 * Function: Initializes the Web3 instance.
 * @param {string} providerUrl - The URL of the Ethereum node or provider.
 */
function initWeb3(providerUrl) {
  if (!web3Instance) {
    web3Instance = new Web3(providerUrl);
    console.log("Web3 instance initialized.");
  }
}

/**
 * Helper Function: Checks if web3Instance is initialized.
 * Logs a warning if web3Instance is not initialized.
 */
function checkWeb3Initialization() {
  if (!web3Instance) {
    console.warn(
      "Warning: Web3 instance is not initialized. Please call initWeb3() first."
    );
    return false;
  }
  return true;
}

// Function: Generates a new random Ethereum account
// @returns {object} - Returns the newly created account object
async function createRandomAccount() {
  if (!checkWeb3Initialization()) return;
  try {
    const account = web3Instance.eth.accounts.create(); // Step 1: Generate a random account
    console.log("New account created:", account.address);
    return account;
  } catch (error) {
    console.error("Error creating account:", error);
    throw error; // Step 2: Signal failure to the caller if an error occurs
  }
}

// Function: Checks if an account has existing transactions
// @param {string} address - The Ethereum address to check
// @returns {Promise<boolean>} - Returns true if transactions exist, false otherwise
async function hasTransactions(address) {
  if (!checkWeb3Initialization()) return;
  try {
    const nonce = await getTransactionCount(web3Instance, address); // Step 1: Get transaction count (nonce)
    return nonce > 0; // Step 2: Return true if nonce > 0
  } catch (error) {
    console.error("Error checking transactions:", error);
    return false;
  }
}

// Function: Retrieves transaction count for an address
// @param {string} address - The Ethereum address to query
// @returns {Promise<number>} - Returns the nonce (transaction count)
async function getTransactionCount(address) {
  if (!checkWeb3Initialization()) return;
  try {
    const nonce = await web3Instance.eth.getTransactionCount(address); // Step 1: Fetch nonce
    return nonce;
  } catch (error) {
    console.error("Error fetching nonce:", error);
    throw error;
  }
}

// Function: Retrieves balance of an account
// @param {string} address - The Ethereum address to check
// @returns {Promise<string>} - Returns the balance in Wei
async function getAccountBalance(address) {
  if (!checkWeb3Initialization()) return;
  try {
    const balance = await web3Instance.eth.getBalance(address); // Step 1: Fetch balance
    console.log("Account balance for", address, "is", balance, "Wei");
    return balance;
  } catch (error) {
    console.error("Error fetching balance:", error);
    throw error;
  }
}

// Function: Validates Ethereum address format
// @param {string} address - The Ethereum address to validate
// @returns {boolean} - Returns true if valid, false otherwise
function isEOAValid(address) {
  if (!checkWeb3Initialization()) return;
  const isValid = Web3.utils.isAddress(address); // Step 1: Validate address format
  console.log("Address", address, "is valid:", isValid);
  return isValid;
}

// Exporting core functions for external use
const core = {
  createRandomAccount,
  hasTransactions,
  getTransactionCount,
  getAccountBalance,
  isEOAValid,
};

module.exports = core;
