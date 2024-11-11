const csv = require("fast-csv");
const fs = require("fs");
const { ethers } = require("hardhat");
const { getProvider } = require("./provider");
const core = require("./core.js");
const NetworkMock = require("../test/helpers/networkMock");

// coverage 테스트 여부 확인
const isCoverage = process.env.COVERAGE === "true";

/**
 * Loads wallet information from a CSV file.
 * @param {string} filePath - The path to the CSV file.
 * @returns {Promise<Array>} - A promise that resolves to an array of wallet objects.
 */
async function loadWalletsFromCSV(filePath) {
  const wallets = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true }))
      .on("data", (row) => wallets.push(row))
      .on("end", () => resolve(wallets))
      .on("error", (error) => reject(error));
  });
}

/**
 * Performs a batch transfer to a list of recipients.
 * @param {Array} loadedWallets - An array of wallet objects loaded from a CSV.
 * @param {object} batchTransferAdminContract - The contract instance to use for the transfer.
 * @param {object} adminWallet - The admin wallet performing the transaction.
 * @returns {Promise<object>} - Returns the transaction receipt.
 */
async function performBatchTransfer(
  loadedWallets,
  batchTransferAdminContract,
  adminWallet,
  networkMock = null
) {
  if (!loadedWallets || loadedWallets.length === 0) {
    throw new Error("No wallets loaded from CSV");
  }

  const recipients = loadedWallets.map((wallet) => wallet.address);
  const amounts = Array(loadedWallets.length).fill(
    ethers.utils.parseEther("0.000123")
  );

  if (recipients.length !== amounts.length) {
    throw new Error("Recipients and amounts arrays must have the same length");
  }

  const getBalance = async (address) => {
    if (isCoverage && networkMock) {
      return networkMock.getBalance(address);
    }
    return ethers.provider.getBalance(address);
  };

  const adminWalletBalanceBefore = await getBalance(adminWallet.address);
  const balancesBefore = await Promise.all(
    recipients.map((address) => getBalance(address))
  );

  let receipt;
  if (isCoverage && networkMock) {
    const tx = await networkMock.mockTransactionResponse();
    receipt = await tx.wait();

    // 모킹된 환경에서 잔액 업데이트
    await networkMock.updateBalances(recipients, amounts);
  } else {
    const tx = await core.batchTransferAdmin(
      batchTransferAdminContract,
      ethers.constants.AddressZero,
      recipients,
      amounts
    );
    receipt = await tx.wait(3);
  }

  if (receipt.status !== 1) {
    throw new Error("Transaction failed");
  }

  const balancesAfter = await Promise.all(
    recipients.map((address) => getBalance(address))
  );

  for (let i = 0; i < recipients.length; i++) {
    const balanceChange = balancesAfter[i].sub(balancesBefore[i]);
    if (balanceChange.toString() !== amounts[i].toString()) {
      throw new Error(`Balance mismatch for recipient ${recipients[i]}`);
    }
  }

  console.log("Batch transfer completed successfully");
  return receipt;
}

module.exports = {
  loadWalletsFromCSV,
  performBatchTransfer,
};
