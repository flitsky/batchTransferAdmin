// Import necessary modules
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { networks } = require("../../hardhat.config.js");
const core = require("../../core/core.js");
const { initProvider } = require("../../core/provider.js");
const {
  loadWalletsFromCSV,
  performBatchTransfer,
} = require("../../core/utils.js");

// Define the CSV file paths as constants
const WALLET_LIST_CSV = "walletList.csv";
const WALLET_CREATE_TEST_CSV = "walletCreateTest.csv";

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
    initProvider();
  });

  // Step 1 & 2: Create Clean Wallet List and Save into CSV File
  it("Should create a list of clean wallets and save them into a CSV file", async function () {
    for (let i = 0; i < 5; i++) {
      const wallet = await core.createCleanWallet();
      cleanWallets.push({
        address: wallet.address,
        privateKey: wallet.privateKey,
      });
    }
    expect(cleanWallets.length).to.equal(5);
    console.log("Created Wallets: ", cleanWallets);

    // Save Wallet List into the appropriate CSV File
    await core.saveWalletsToCSV(cleanWallets, WALLET_CREATE_TEST_CSV);
  });

  // Step 3 & 4: Load Wallet List and Send Coin/Token for Testing
  it.only("Should load wallet list from CSV and send minimum coin and token to each wallet", async function () {
    const loadedWallets = await loadWalletsFromCSV(WALLET_LIST_CSV);
    expect(loadedWallets.length).to.equal(5);
    console.log("Loaded Wallets: ", loadedWallets);

    // Perform batch transfer using the helper function
    const receipt = await performBatchTransfer(
      loadedWallets,
      batchTransferAdminContract,
      adminWallet
    );
    expect(receipt.status).to.equal(1, "Transaction failed");
    console.log(
      "https://amoy.polygonscan.com/address/0xCd3b0FE58cC79152935e77a8E9e43742dc548B1C"
    );
  });
});

// Helper function to connect wallets
async function connectWallets(privateKeys) {
  return Promise.all(
    privateKeys.map((privateKey) =>
      new ethers.Wallet(privateKey, ethers.provider).connect(ethers.provider)
    )
  );
}
