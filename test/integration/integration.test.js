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
  let adminWallet, admin1, admin2, nonAdmin, batchTransferAdminContract, token;

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
    const BatchTransferAdminFactory = await ethers.getContractFactory(
      "BatchTransferAdmin"
    );
    const deployedContractAddress =
      networks.amoy.deployed_batch_transfer_address;
    batchTransferAdminContract = await BatchTransferAdminFactory.attach(
      deployedContractAddress
    );
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
      batchTransferAdminContract,
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
// Description: This test suite verifies the entire state transition process for wallet token transfers, including creating clean wallets, transferring coins and tokens to them, and then having each wallet return the assets back to the Admin wallet.
describe("Wallet Token Transfer State Transition Tests", function () {
  // Declare variables to be used across tests
  let adminWallet, admin1, admin2, nonAdmin, batchTransferAdminContract, token;
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
  it.only("Should load wallet list from CSV and send minimum coin and token to each wallet", async function () {
    // Promise를 반환하는 형태로 변경
    return new Promise((resolve, reject) => {
      const loadedWallets = [];
      fs.createReadStream("cleanWalletList.csv")
        .pipe(csv.parse({ headers: true }))
        .on("data", (row) => {
          loadedWallets.push(row);
        })
        .on("end", async () => {
          try {
            await performBatchTransfer(loadedWallets);
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  });

  async function performBatchTransfer(loadedWallets) {
    // 입력값 검증 추가
    if (!loadedWallets || loadedWallets.length === 0) {
      throw new Error("No wallets loaded from CSV");
    }

    expect(loadedWallets.length).to.equal(5);
    console.log("Loaded Wallets: ", loadedWallets);

    const recipients = loadedWallets.map((wallet) => wallet.address);
    const amounts = Array(loadedWallets.length).fill(
      ethers.utils.parseEther("0.000123")
    );

    // 트랜잭션 실행 전 검증 로직 추가
    if (recipients.length !== amounts.length) {
      throw new Error(
        "Recipients and amounts arrays must have the same length"
      );
    }

    // 트랜잭션 전 잔액 조회 : 자산 전송 계정
    const adminWalletBalanceBefore = await ethers.provider.getBalance(
      adminWallet.address
    );
    // 트랜잭션 전 잔액 조회 : 자산 수신 계정
    const balancesBefore = await Promise.all(
      recipients.map((address) => ethers.provider.getBalance(address))
    );

    // 트랜잭션 실행
    const tx = await core.batchTransferAdmin(
      batchTransferAdminContract,
      recipients,
      amounts
    );

    // 트랜잭션 3컨컴 대기
    const receipt = await tx.wait(3);

    // 트랜잭션 성공 검증
    expect(receipt.status).to.equal(1, "Transaction failed");

    // 트랜잭션 후 잔액 조회 : 자산 전송 계정
    const adminWalletBalanceAfter = await ethers.provider.getBalance(
      adminWallet.address
    );

    // 트랜잭션 후 잔액 조회 : 자산 수신 계정
    const balancesAfter = await Promise.all(
      recipients.map((address) => ethers.provider.getBalance(address))
    );

    for (let i = 0; i < recipients.length; i++) {
      const balanceChange = balancesAfter[i].sub(balancesBefore[i]);
      if (balanceChange.toString() !== amounts[i].toString()) {
        throw new Error(`Balance mismatch for recipient ${recipients[i]}`);
      }
    }

    // 전송된 총 금액 계산
    const totalAmountSent = amounts.reduce(
      (acc, amount) => acc.add(amount),
      ethers.BigNumber.from(0)
    );

    // 예상되는 잔액 계산 (가스비 소모량 제외)
    const expectedBalanceAfter = adminWalletBalanceBefore.sub(totalAmountSent);

    // 잔액 검증 lt 이유는 가스비 소모량을 감안하여 예상 잔액이 더 작을 것이기 때문
    expect(adminWalletBalanceAfter.lt(expectedBalanceAfter)).to.be.true;

    return receipt;
  }
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
