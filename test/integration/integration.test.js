// Import necessary modules
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { networks } = require("../../hardhat.config.js");
const core = require("../../core/core.js");
const { initProvider } = require("../../core/provider.js");
const {
  readCSVFile,
  performBatchTransfer,
  connectWallets,
  attachContract,
  createRandomWallets,
} = require("../../core/utils.js");
const NetworkMock = require("../helpers/networkMock");

// Define constants
const TOTAL_WALLETS = 10;
const WALLET_LIST_CSV = "walletList.csv";
const WALLET_CREATE_TEST_CSV = "walletCreateTest.csv";
const TRANSFER_COIN_BATCH_LIST_CSV = "transferCoinBatchList.csv";
const TRANSFER_TOKEN_BATCH_LIST_CSV = "transferTokenBatchList.csv";

// Test Suite for Wallet Token Transfers
describe("Wallet Token Transfer State Transition Tests", function () {
  let adminWallet,
    admin1,
    admin2,
    nonAdmin,
    batchTransferAdminContract,
    mockERC20Contract;
  let cleanWallets = [];
  let networkMock;

  // Set timeout for the entire test suite
  this.timeout(60000);

  before(async function () {
    [adminWallet, admin1, admin2, nonAdmin] = await connectWallets(
      networks.amoy.accounts
    );
    batchTransferAdminContract = await attachContract(
      "BatchTransferAdmin",
      networks.amoy.deployed_batch_transfer_address
    );
    mockERC20Contract = await attachContract(
      "MockERC20",
      networks.amoy.deployed_mock_erc20_address
    );
    initProvider();
    const network = process.env.NETWORK || "testnet";
    core.setGasOptions(network);

    if (process.env.COVERAGE === "true") {
      networkMock = new NetworkMock();
      networkMock.setBalance(
        adminWallet.address,
        ethers.utils.parseEther("10.0")
      );
    }
  });

  it("Should create a list of random wallets and save them into a CSV file", async function () {
    cleanWallets = await createRandomWallets(TOTAL_WALLETS);
    expect(cleanWallets.length).to.equal(TOTAL_WALLETS);
    await core.saveWalletsToCSV(cleanWallets, WALLET_CREATE_TEST_CSV);
  });

  it("Should load wallet list from CSV and send minimum coin and token to each wallet", async function () {
    this.timeout(60000);

    const csvData = await readCSVFile(TRANSFER_COIN_BATCH_LIST_CSV);
    console.log(`Loaded CSV Data Length: ${csvData.length}`);

    const { recipients, amounts } = csvData.reduce(
      (acc, row, index) => {
        if (!row || typeof row.toEOA !== "string") {
          throw new Error(
            `Missing or invalid "toEOA" field in row ${index + 1}`
          );
        }

        const address = row.toEOA;
        if (!ethers.utils.isAddress(address)) {
          throw new Error(
            `Invalid address detected in row ${index + 1}: ${address}`
          );
        }

        if (!row.amount) {
          throw new Error(`Missing "amount" field in row ${index + 1}`);
        }

        acc.recipients.push(address);
        acc.amounts.push(ethers.utils.parseEther(row.amount.toString()));
        return acc;
      },
      { recipients: [], amounts: [] }
    );

    console.time("batchTransfer");

    const receipt = await performBatchTransfer(
      batchTransferAdminContract,
      ethers.constants.AddressZero,
      recipients,
      amounts,
      adminWallet,
      process.env.COVERAGE === "true" ? networkMock : null
    );
    console.timeEnd("batchTransfer");

    expect(receipt.status).to.equal(1, "Transaction failed");
    console.log(
      "https://amoy.polygonscan.com/address/0xCd3b0FE58cC79152935e77a8E9e43742dc548B1C"
    );
  });

  it("Should individually control the wallets that receive asset transfers", async function () {
    this.timeout(60000);

    const csvData = await readCSVFile(TRANSFER_COIN_BATCH_LIST_CSV);
    console.log(`Loaded CSV Data Length: ${csvData.length}`);

    // Promise.all과 map을 사용하여 비동기 작업 처리
    const balanceChecks = await Promise.all(
      csvData.map(async (row) => {
        const addr = row.toEOA;
        const expectedAmount = ethers.utils.parseEther(row.amount.toString());
        const bal = await ethers.provider.getBalance(addr);
        console.log(`Balance of ${addr}: ${ethers.utils.formatEther(bal)} POL`);
        return {
          address: addr,
          balance: bal,
          expectedAmount: expectedAmount,
        };
      })
    );

    balanceChecks.forEach(({ address, balance, expectedAmount }) => {
      expect(balance.gte(expectedAmount)).to.be.true;
    });
  });
});
