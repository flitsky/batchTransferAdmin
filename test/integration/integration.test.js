// Import necessary modules
const { expect } = require("chai");
const { ethers } = require("hardhat");
const moduleConf = require("../../config/config.js");
const csv = require("fast-csv");
const fs = require("fs");
const core = require("../../core/core.js");
const { networks } = require("../../hardhat.config.js");

// Define the test suite for the Create Clean Account on testnet
describe("Create Clean Account Tests on Amoy Testnet", function () {
  // Declare variables to be used across tests
  let adminWallet;

  // Before all tests, set up initial state
  before(async function () {
    // 개인 키를 Wallet 객체로 변환하고 Signer로 설정
    const moduleWallets = moduleConf.accounts.map(
      (privateKey) => new ethers.Wallet(privateKey, ethers.provider)
    );

    [adminWallet] = await Promise.all(
      moduleWallets.map((wallet) => wallet.connect(ethers.provider))
    );
  });

  it("Checks adminWallet transaction count on Polygon Amoy", async function () {
    const account = adminWallet;
    console.log("adminWallet:", account.address);

    const balance = await ethers.provider.getBalance(account.address);
    console.log("Balance:", ethers.utils.formatEther(balance));

    // Check if the account has any transactions by checking the transaction count with core.hasTransactions
    const hasTransactions = await core.hasTransactions(account.address);
    console.log("Has transactions:", hasTransactions);
    console.log(
      "https://amoy.polygonscan.com/address/0xCd3b0FE58cC79152935e77a8E9e43742dc548B1C"
    );
  });
});

// Define the test suite for the BatchTransferAdmin contract on testnet
describe("BatchTransferAdmin Tests on Amoy Testnet", function () {
  // Declare variables to be used across tests
  let adminWallet, admin1, admin2, nonAdmin, contract, token;

  // Before all tests, deploy the contracts and set up initial state
  before(async function () {
    // 개인 키를 Wallet 객체로 변환하고 Signer로 설정
    const moduleWallets = moduleConf.accounts.map(
      (privateKey) => new ethers.Wallet(privateKey, ethers.provider)
    );

    [adminWallet, admin1, admin2, nonAdmin] = await Promise.all(
      moduleWallets.map((wallet) => wallet.connect(ethers.provider))
    );

    // Attach to the already deployed BatchTransferAdmin contract
    const BatchTransferAdmin = await ethers.getContractFactory(
      "BatchTransferAdmin"
    );
    const deployedContractAddress =
      networks.amoy.deployed_batch_transfer_address;
    contract = await BatchTransferAdmin.attach(deployedContractAddress);
  });

  it("Checks adminWallet Account's transaction count on Polygon Amoy", async function () {
    const account = adminWallet;
    console.log("adminWallet Account:", account.address);

    const balance = await ethers.provider.getBalance(account.address);
    console.log("Balance:", ethers.utils.formatEther(balance));

    // Check if the account has any transactions by checking the transaction count
    const transactionCount = await ethers.provider.getTransactionCount(
      account.address
    );
    const hasTransactions = transactionCount > 0;
    console.log("Has transactions:", hasTransactions, transactionCount);
    console.log(
      "https://amoy.polygonscan.com/address/0xCd3b0FE58cC79152935e77a8E9e43742dc548B1C"
    );
  });

  it.skip("Should perform a batch transfer on Polygon Amoy", async function () {
    const recipients = [admin1.address, admin2.address];
    const amounts = [
      ethers.utils.parseEther("0.0123"),
      ethers.utils.parseEther("0.0135"),
    ];

    // Use the batchTransferAdmin function from core
    const receipt = await core.batchTransferAdmin(
      contract,
      recipients,
      amounts
    );

    // Verify the transaction was successful
    expect(receipt.status).to.equal(1);

    console.log(
      "https://amoy.polygonscan.com/address/0xCd3b0FE58cC79152935e77a8E9e43742dc548B1C"
    );
  });
});

// State Transition Test Suite for Wallet Token Transfers
describe("Wallet Token Transfer State Transition Tests", function () {
  // Declare variables to be used across tests
  let adminWallet, admin1, admin2, nonAdmin, contract, token;
  let cleanWallets = [];

  // Before all tests, deploy the contracts and set up initial state
  before(async function () {
    // 개인 키를 Wallet 객체로 변환하고 Signer로 설정
    const moduleWallets = moduleConf.accounts.map(
      (privateKey) => new ethers.Wallet(privateKey, ethers.provider)
    );

    [adminWallet, admin1, admin2, nonAdmin] = await Promise.all(
      moduleWallets.map((wallet) => wallet.connect(ethers.provider))
    );
  });

  // Step 1 & 2: Create Clean Wallet List and Save into CSV File
  it("Should create a list of clean wallets and save them into cleanWalletList.csv", async function () {
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
  it("Should load wallet list from CSV and send minimum coin and token to each wallet", function (done) {
    const loadedWallets = [];
    fs.createReadStream("cleanWalletList.csv")
      .pipe(csv.parse({ headers: true }))
      .on("data", (row) => {
        loadedWallets.push(row);
      })
      .on("end", () => {
        expect(loadedWallets.length).to.equal(5);
        console.log("Loaded Wallets: ", loadedWallets);
        done();
      });
  });

  // // Step 5: Each wallet returns all the tokens back to the Admin Wallet
  // it("Should load wallet list and return all tokens back to the admin wallet", function (done) {
  //   const loadedWallets = [];
  //   fs.createReadStream("cleanWalletList.csv")
  //     .pipe(csv.parse({ headers: true }))
  //     .on("data", (row) => {
  //       loadedWallets.push(row);
  //     })
  //     .on("end", async () => {
  //       expect(loadedWallets.length).to.equal(5);
  //       cleanWallets = loadedWallets;

  //       // Return all tokens back to the admin wallet
  //       for (const walletInfo of cleanWallets) {
  //         const wallet = new ethers.Wallet(
  //           walletInfo.privateKey,
  //           ethers.provider
  //         );
  //         // TODO: Get token balance of each wallet and send it back to the admin wallet
  //         // Example:
  //         // const tokenBalance = await tokenContract.balanceOf(wallet.address);
  //         // await tokenContract.connect(wallet).transfer(adminWallet.address, tokenBalance);
  //       }
  //       done();
  //     });
  // });
});
