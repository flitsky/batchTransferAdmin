// Import necessary modules
const { expect } = require("chai");
const { ethers } = require("hardhat");
const csv = require("fast-csv");
const fs = require("fs");
const core = require("../../core/core.js");
const { networks } = require("../../hardhat.config.js");

// Helper function to connect wallets
async function connectWallets(privateKeys) {
  return Promise.all(
    privateKeys.map((privateKey) =>
      new ethers.Wallet(privateKey, ethers.provider).connect(ethers.provider)
    )
  );
}

// State Transition Test Suite for Wallet Token Transfers
describe("Wallet Token Transfer State Transition Tests", function () {
  let adminWallet, admin1, admin2, nonAdmin, batchTransferAdminContract;
  let cleanWallets = [];

  before(async function () {
    [adminWallet, admin1, admin2, nonAdmin] = await connectWallets(
      networks.amoy.accounts
    );

    // Attach to the already deployed BatchTransferAdmin contract
    const BatchTransferAdminFactory = await ethers.getContractFactory(
      "BatchTransferAdmin"
    );
    const deployedContractAddress =
      networks.amoy.deployed_batch_transfer_address;
    batchTransferAdminContract = await BatchTransferAdminFactory.attach(
      deployedContractAddress
    );
  });

  // Step 1 & 2: Create Clean Wallet List and Save into CSV File
  it.skip("Should create a list of clean wallets and save them into cleanWalletList.csv", async function () {
    for (let i = 0; i < 5; i++) {
      const wallet = await core.createCleanWallet();
      cleanWallets.push({
        address: wallet.address,
        privateKey: wallet.privateKey,
      });
    }
    expect(cleanWallets.length).to.equal(5);
    console.log("Created Wallets: ", cleanWallets);

    // Save Wallet List into CSV File
    await core.saveWalletsToCSV(cleanWallets, "cleanWalletList.csv");
  });

  // Step 3 & 4: Load Wallet List and Send Coin/Token for Testing
  it.only("Should load wallet list from CSV and send minimum coin and token to each wallet", async function () {
    return new Promise((resolve, reject) => {
      const loadedWallets = [];
      fs.createReadStream("cleanWalletList.csv")
        .pipe(csv.parse({ headers: true }))
        .on("data", (row) => loadedWallets.push(row))
        .on("end", async () => {
          try {
            await performBatchTransfer(loadedWallets);
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on("error", (error) => reject(error));
    });
    console.log(
      "https://amoy.polygonscan.com/address/0xCd3b0FE58cC79152935e77a8E9e43742dc548B1C"
    );
  });

  async function performBatchTransfer(loadedWallets) {
    if (!loadedWallets || loadedWallets.length === 0) {
      throw new Error("No wallets loaded from CSV");
    }

    expect(loadedWallets.length).to.equal(5);
    console.log("Loaded Wallets: ", loadedWallets);

    const recipients = loadedWallets.map((wallet) => wallet.address);
    const amounts = Array(loadedWallets.length).fill(
      ethers.utils.parseEther("0.000123")
    );

    if (recipients.length !== amounts.length) {
      throw new Error(
        "Recipients and amounts arrays must have the same length"
      );
    }

    const adminWalletBalanceBefore = await ethers.provider.getBalance(
      adminWallet.address
    );
    const balancesBefore = await Promise.all(
      recipients.map((address) => ethers.provider.getBalance(address))
    );

    const tx = await core.batchTransferAdmin(
      batchTransferAdminContract,
      ethers.constants.AddressZero,
      recipients,
      amounts
    );
    const receipt = await tx.wait(3);

    expect(receipt.status).to.equal(1, "Transaction failed");

    const adminWalletBalanceAfter = await ethers.provider.getBalance(
      adminWallet.address
    );
    const balancesAfter = await Promise.all(
      recipients.map((address) => ethers.provider.getBalance(address))
    );

    for (let i = 0; i < recipients.length; i++) {
      const balanceChange = balancesAfter[i].sub(balancesBefore[i]);
      if (balanceChange.toString() !== amounts[i].toString()) {
        throw new Error(`Balance mismatch for recipient ${recipients[i]}`);
      }
    }

    const totalAmountSent = amounts.reduce(
      (acc, amount) => acc.add(amount),
      ethers.BigNumber.from(0)
    );
    const expectedBalanceAfter = adminWalletBalanceBefore.sub(totalAmountSent);

    expect(adminWalletBalanceAfter.lt(expectedBalanceAfter)).to.be.true;

    return receipt;
  }
});
