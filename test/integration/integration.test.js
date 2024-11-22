// Import necessary modules
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { networks } = require("../../hardhat.config.js");
const core = require("../../core/core.js");
const { initProvider } = require("../../core/provider.js");
const {
  loadWalletsFromCSV,
  performBatchTransfer,
  connectWallets,
  attachContract,
  createRandomWallets,
} = require("../../core/utils.js");
const NetworkMock = require("../helpers/networkMock");

// Define constants
const WALLET_LIST_CSV = "walletList.csv";
const WALLET_CREATE_TEST_CSV = "walletCreateTest.csv";
const TOTAL_WALLETS = 10;

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
    console.log("Created Wallets: ", cleanWallets);
    await core.saveWalletsToCSV(cleanWallets, WALLET_CREATE_TEST_CSV);
  });

  it("Should load wallet list from CSV and send minimum coin and token to each wallet", async function () {
    this.timeout(60000);

    const recipientWallets = await loadWalletsFromCSV(WALLET_LIST_CSV);
    expect(recipientWallets.length).to.equal(TOTAL_WALLETS);

    // Validate addresses
    recipientWallets.forEach((wallet) => {
      if (!ethers.utils.isAddress(wallet.address)) {
        throw new Error(`Invalid address detected: ${wallet.address}`);
      }
    });

    const recipients = recipientWallets.map((wallet) => wallet.address);
    const amounts = Array(recipients.length).fill(
      ethers.utils.parseEther("0.000123")
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

    const loadedWallets = await loadWalletsFromCSV(WALLET_LIST_CSV);
    expect(loadedWallets.length).to.equal(TOTAL_WALLETS);
    //console.log("Loaded Wallets: ", loadedWallets);

    // Promise.all과 map을 사용하여 비동기 작업 처리
    const balanceChecks = await Promise.all(
      loadedWallets.map(async (wallet) => {
        const balance = await ethers.provider.getBalance(wallet.address);
        console.log(
          `Balance of ${wallet.address}: ${ethers.utils.formatEther(
            balance
          )} POL`
        );
        return {
          address: wallet.address,
          balance: balance,
        };
      })
    );

    // BigNumber 비교로 수정
    balanceChecks.forEach(({ address, balance }) => {
      expect(balance.gt(ethers.constants.Zero)).to.be.true;
    });
  });
});
