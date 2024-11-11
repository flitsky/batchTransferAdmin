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
const NetworkMock = require("../helpers/networkMock");

// Define the CSV file paths as constants
const WALLET_LIST_CSV = "walletList.csv";
const WALLET_CREATE_TEST_CSV = "walletCreateTest.csv";
const TOTAL_WALLETS = 5;

// State Transition Test Suite for Wallet Token Transfers
describe("Wallet Token Transfer State Transition Tests", function () {
  let adminWallet, admin1, admin2, nonAdmin, batchTransferAdminContract;
  let cleanWallets = [];
  let networkMock;

  // 전체 테스트 스위트의 타임아웃 설정
  this.timeout(60000); // 1분으로 설정

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

    // coverage 테스트일 경우 네트워크 모킹 초기화
    if (process.env.COVERAGE === "true") {
      networkMock = new NetworkMock();
      // 테스트용 초기 잔액 설정
      networkMock.setBalance(
        adminWallet.address,
        ethers.utils.parseEther("10.0")
      );
    }
  });

  // Step 1 & 2: Create Clean Wallet List and Save into CSV File
  it("Should create a list of clean wallets and save them into a CSV file", async function () {
    for (let i = 0; i < TOTAL_WALLETS; i++) {
      const wallet = await core.createCleanWallet();
      cleanWallets.push({
        address: wallet.address,
        privateKey: wallet.privateKey,
      });
    }
    expect(cleanWallets.length).to.equal(TOTAL_WALLETS);
    console.log("Created Wallets: ", cleanWallets);

    // Save Wallet List into the appropriate CSV File
    await core.saveWalletsToCSV(cleanWallets, WALLET_CREATE_TEST_CSV);
  });

  // Step 3 & 4: Load Wallet List and Send Coin/Token for Testing
  it("Should load wallet list from CSV and send minimum coin and token to each wallet", async function () {
    // 개별 테스트의 타임아웃 설정
    this.timeout(60000);

    const loadedWallets = await loadWalletsFromCSV(WALLET_LIST_CSV);
    expect(loadedWallets.length).to.equal(TOTAL_WALLETS);
    console.log("Loaded Wallets: ", loadedWallets);

    // coverage 테스트일 경우 각 지갑의 초기 잔액 설정
    if (process.env.COVERAGE === "true") {
      loadedWallets.forEach((wallet) => {
        networkMock.setBalance(wallet.address, ethers.utils.parseEther("0.0"));
      });
    }

    // Perform batch transfer using the helper function
    const receipt = await performBatchTransfer(
      loadedWallets,
      batchTransferAdminContract,
      adminWallet,
      process.env.COVERAGE === "true" ? networkMock : null
    );
    expect(receipt.status).to.equal(1, "Transaction failed");
    console.log(
      "https://amoy.polygonscan.com/address/0xCd3b0FE58cC79152935e77a8E9e43742dc548B1C"
    );
  });

  // Step 5 & 6: Individually control the wallets that receive asset transfers
  it.only("Should individually control the wallets that receive asset transfers", async function () {
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
          )} ETH`
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

// Helper function to connect wallets
async function connectWallets(privateKeys) {
  return Promise.all(
    privateKeys.map((privateKey) =>
      new ethers.Wallet(privateKey, ethers.provider).connect(ethers.provider)
    )
  );
}
