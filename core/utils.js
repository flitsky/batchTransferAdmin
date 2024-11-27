// Import necessary modules
const fs = require("fs");
const csv = require("fast-csv");
const { ethers } = require("hardhat");
const core = require("./core.js");
const NetworkMock = require("../test/helpers/networkMock");

// Check if coverage testing is enabled
const isCoverage = process.env.COVERAGE === "true";

/**
 * Reads data from a CSV file.
 * @param {string} filePath - The path to the CSV file.
 * @returns {Promise<Array>} - A promise that resolves to an array of objects representing the CSV rows.
 */
async function readCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const data = [];
    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true }))
      .on("data", (row) => data.push(row))
      .on("end", () => resolve(data))
      .on("error", reject);
  });
}

/**
 * Validates that the recipients and amounts arrays have the same length.
 * @param {Array} recipients - The array of recipient addresses.
 * @param {Array} amounts - The array of amounts to be transferred.
 * @throws Will throw an error if the lengths of the arrays do not match.
 */
function validateRecipientsAndAmounts(recipients, amounts) {
  if (recipients.length !== amounts.length) {
    throw new Error("Recipients and amounts arrays must have the same length");
  }
}

/**
 * Retrieves the balance of a given address.
 * @param {string} address - The address to check the balance for.
 * @param {object} [networkMock=null] - The optional network mock for testing purposes.
 * @returns {Promise<BigNumber>} - The balance of the address.
 */
async function getBalance(address, networkMock = null) {
  if (isCoverage && networkMock) {
    return networkMock.getBalance(address);
  }
  return ethers.provider.getBalance(address);
}

/**
 * Performs a batch transfer to a list of recipients.
 * @param {object} batchTransferAdminContract - The contract instance to use for the transfer.
 * @param {string} tokenAddress - The address of the token to transfer (use AddressZero for ETH).
 * @param {Array} recipients - An array of recipient addresses.
 * @param {Array} amounts - An array of amounts to transfer to each recipient in ether.
 * @param {object} adminWallet - The admin wallet performing the transaction.
 * @param {object} [networkMock=null] - The optional network mock for testing purposes.
 * @returns {Promise<object>} - Returns the transaction receipt.
 */
async function performBatchTransfer(
  batchTransferAdminContract,
  tokenAddress,
  recipients,
  amounts,
  adminWallet,
  networkMock = null
) {
  if (!recipients?.length) throw new Error("No addresses provided");

  validateRecipientsAndAmounts(recipients, amounts);

  const initialBalances = await Promise.all(
    recipients.map((address) =>
      isCoverage && networkMock
        ? networkMock.getBalance(address)
        : ethers.provider.getBalance(address)
    )
  );

  // console.time check for the tx
  console.time("batchTx");
  let receipt;
  if (isCoverage && networkMock) {
    const tx = await networkMock.mockTransactionResponse();
    receipt = await tx.wait();

    // coverage 환경에서 잔액 업데이트
    await Promise.all(
      recipients.map((recipient, i) =>
        networkMock.setBalance(recipient, initialBalances[i].add(amounts[i]))
      )
    );
  } else {
    // 현재 nonce 값을 가져옴
    const nonce = await ethers.provider.getTransactionCount(
      adminWallet.address
    );

    const tx = await core.batchTransferAdmin(
      batchTransferAdminContract,
      tokenAddress,
      recipients,
      amounts,
      adminWallet,
      {
        nonce: nonce, // 현재 nonce 값 사용
        gasLimit: 300000,
        maxFeePerGas: ethers.utils.parseUnits("50", "gwei"),
        maxPriorityFeePerGas: ethers.utils.parseUnits("1.5", "gwei"),
      }
    );
    console.timeEnd("batchTx");
    console.time("wait");
    receipt = await tx.wait(1);
    console.timeEnd("wait");
  }

  if (receipt.status !== 1) throw new Error("Transaction failed");

  console.log("Batch transfer completed successfully");
  return receipt;
}

// Helper function to connect wallets
async function connectWallets(privateKeys) {
  return Promise.all(
    privateKeys.map((privateKey) =>
      new ethers.Wallet(privateKey, ethers.provider).connect(ethers.provider)
    )
  );
}

// Helper function to attach to a deployed contract
async function attachContract(contractName, address) {
  const ContractFactory = await ethers.getContractFactory(contractName);
  return ContractFactory.attach(address);
}

// Helper function to create random wallets
async function createRandomWallets(count) {
  const wallets = [];
  for (let i = 0; i < count; i++) {
    const wallet = await core.createRandomWallet();
    wallets.push({ address: wallet.address, privateKey: wallet.privateKey });
  }
  return wallets;
}

module.exports = {
  readCSVFile,
  performBatchTransfer,
  connectWallets,
  attachContract,
  createRandomWallets,
};
