// Import ethers from Hardhat
const { ethers } = require("hardhat");
const csv = require("fast-csv");
const fs = require("fs");

/**
 * Core.js Module
 * Provides core blockchain functions for account management, transaction checks, balance retrieval, and validation.
 */

let provider = ethers.provider; // Default to Hardhat's provider

let gasOptions = {
  gasLimit: ethers.BigNumber.from(300000),
  gasPrice: ethers.utils.parseUnits("50", "gwei"),
};

/**
 * Initializes the provider.
 * @param {string} network - The name of the network (e.g., 'localhost', 'mainnet').
 */
function initProvider(network) {
  try {
    provider = network
      ? new ethers.providers.JsonRpcProvider(network)
      : ethers.provider;
    console.log(
      `Provider initialized for network: ${network} || "default Hardhat provider"`
    );
  } catch (error) {
    console.error(
      `Error initializing provider with network ${network}. Falling back to default provider.`,
      error
    );
    provider = ethers.provider;
  }
}

/**
 * Generates a new random Ethereum account.
 * @returns {Promise<object>} - Returns the newly created random wallet object.
 */
async function createRandomWallet() {
  try {
    const wallet = ethers.Wallet.createRandom();
    console.log(`New account created: ${wallet.address}`);
    return wallet;
  } catch (error) {
    console.error(`Error creating account:`, error);
    throw error;
  }
}

/**
 * Generates a new clean Ethereum account.
 * @param {number} maxRetries - Maximum number of retries to create a clean wallet.
 * @returns {Promise<object>} - Returns the newly created clean wallet object.
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
 * Checks if an account has existing transactions.
 * @param {string} address - The Ethereum address to check.
 * @returns {Promise<boolean>} - Returns true if transactions exist, false otherwise.
 */
async function hasTransactions(address) {
  if (!provider) {
    console.warn(
      `Warning: Provider is not initialized. Please call initProvider() first.`
    );
    return false;
  }

  try {
    const nonce = await provider.getTransactionCount(address);
    return nonce > 0;
  } catch (error) {
    console.error(`Error checking transactions for ${address}:`, error);
    return false;
  }
}

/**
 * Retrieves balance of an account.
 * @param {string} address - The Ethereum address to check.
 * @returns {Promise<string>} - Returns the balance in Wei.
 */
async function getAccountBalance(address) {
  if (!provider) {
    console.warn(
      `Warning: Provider is not initialized. Please call initProvider() first.`
    );
    return null;
  }

  try {
    const balance = await provider.getBalance(address);
    const balanceInEther = ethers.utils.formatEther(balance);
    console.log(`Account balance for ${address} is ${balanceInEther} Ether`);
    return balance.toString();
  } catch (error) {
    console.error(`Error fetching balance for ${address}:`, error);
    throw error;
  }
}

/**
 * Validates Ethereum address format.
 * @param {string} address - The Ethereum address to validate.
 * @returns {boolean} - Returns true if valid, false otherwise.
 */
function isEOAValid(address) {
  const isValid = ethers.utils.isAddress(address);
  console.log(`Address ${address} is valid: ${isValid}`);
  return isValid;
}

/**
 * Performs a batch transfer.
 * @param {object} contract - The contract instance to use for the transfer.
 * @param {string} tokenAddress - The address of the token to transfer (use AddressZero for ETH).
 * @param {array} recipients - Array of recipient addresses.
 * @param {array} amounts - Array of amounts to transfer.
 * @param {object} adminWallet - The wallet object of the admin.
 * @param {object} options - Additional options for the transfer.
 * @returns {Promise<object>} - Returns the transaction receipt.
 */
async function batchTransferAdmin(
  contract,
  tokenAddress,
  recipients,
  amounts,
  adminWallet,
  options = {}
) {
  const totalAmount = amounts.reduce(
    (acc, amount) => acc.add(amount),
    ethers.BigNumber.from(0)
  );

  const { gasLimit, gasPrice } = options;

  const tx = await contract.batchTransfer(tokenAddress, recipients, amounts, {
    from: adminWallet.address,
    value: tokenAddress === ethers.constants.AddressZero ? totalAmount : 0,
    gasLimit: gasLimit || 300000,
    gasPrice: gasPrice || ethers.utils.parseUnits("50", "gwei"),
  });

  return tx;
}

/**
 * Saves wallet list into a CSV file.
 * @param {array} wallets - Array of wallet objects to save.
 * @param {string} fileName - The name of the CSV file to create.
 * @returns {Promise<void>} - Resolves when the file is successfully written.
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

/**
 * Sets the gas options based on the network.
 * @param {string} network - The name of the network (e.g., 'mainnet', 'testnet').
 */
function setGasOptions(network) {
  if (network === "mainnet") {
    gasOptions = {
      gasLimit: ethers.BigNumber.from(500000),
      gasPrice: ethers.utils.parseUnits("100", "gwei"),
    };
  } else {
    gasOptions = {
      gasLimit: ethers.BigNumber.from(300000),
      gasPrice: ethers.utils.parseUnits("50", "gwei"),
    };
  }
}

// Exporting core functions for external use
module.exports = {
  createRandomWallet,
  createCleanWallet,
  hasTransactions,
  getAccountBalance,
  isEOAValid,
  initProvider,
  batchTransferAdmin,
  saveWalletsToCSV,
  setGasOptions,
  getGasOptions: () => gasOptions,
};
