// Import ethers from Hardhat
const { ethers } = require("hardhat");

// Import necessary modules
const csv = require("fast-csv");
const fs = require("fs");

/**
 * Core.js Module
 * Provides core blockchain functions for account management, transaction checks, balance retrieval, and validation.
 */

let provider = ethers.provider; // Default to Hardhat's provider

/**
 * Function: Initializes the provider.
 * @param {string} network - The name of the network (e.g., 'localhost', 'mainnet').
 */
function initProvider(network) {
  try {
    if (network) {
      provider = new ethers.providers.JsonRpcProvider(network);
    } else {
      provider = ethers.provider; // 하드햇의 기본 프로바이더 사용
    }
    console.log(
      "Provider initialized for network:",
      network || "default Hardhat provider"
    );
  } catch (error) {
    console.error(
      "Error initializing provider with network",
      network,
      ". Falling back to default provider.",
      error
    );
    provider = ethers.provider; // 기본 프로바이더로 fallback
  }
}

/**
 * Function: Generates a new random Ethereum account
 * @returns {object} - Returns the newly created random wallet object
 */
async function createRandomWallet() {
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
async function createCleanWallet(maxRetries = 3) {
  let wallet = await createRandomWallet();
  let retryCount = 0;
  while (await hasTransactions(wallet.address)) {
    retryCount++;
    if (retryCount > maxRetries) {
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

/**
 * Function: Performs a batch transfer
 * @param {object} contract - The contract instance to use for the transfer
 * @param {array} recipients - Array of recipient addresses
 * @param {array} amounts - Array of amounts to transfer
 * @returns {Promise<object>} - Returns the transaction receipt
 */
async function batchTransferAdmin(contract, recipients, amounts) {
  const totalAmount = amounts.reduce(
    (acc, amount) => acc.add(amount),
    ethers.BigNumber.from(0)
  );

  const tx = await contract.batchTransfer(
    ethers.constants.AddressZero,
    recipients,
    amounts,
    {
      value: totalAmount,
    }
  );

  return tx;
}

/**
 * Function: Saves wallet list into a CSV file
 * @param {array} wallets - Array of wallet objects to save
 * @param {string} fileName - The name of the CSV file to create
 * @returns {Promise<void>} - Resolves when the file is successfully written
 */
function saveWalletsToCSV(wallets, fileName) {
  return new Promise((resolve, reject) => {
    const csvStream = csv.format({ headers: true });
    const writableStream = fs.createWriteStream(fileName);

    writableStream.on("finish", resolve);
    writableStream.on("error", reject);

    csvStream.pipe(writableStream);
    wallets.forEach((wallet) => csvStream.write(wallet));
    csvStream.end();
  });
}

// Exporting core functions for external use
const core = {
  createRandomWallet,
  createCleanWallet,
  hasTransactions,
  getAccountBalance,
  isEOAValid,
  initProvider,
  batchTransferAdmin,
  saveWalletsToCSV,
};

module.exports = core;
