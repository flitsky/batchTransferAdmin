// Import required libraries for testing
const { expect } = require("chai");
const core = require("./core.js");
const { ethers } = require("hardhat");
const fs = require("fs");

/**
 * Test Suite for Core.js Module
 * This suite covers functions provided in core.js including account management,
 * transaction checks, balance retrieval, and address validation.
 */

describe("Core Module Unit Test", function () {
  // Before each test, initialize the provider
  beforeEach(function () {
    core.initProvider();
  });

  it("Should create a new random wallet", async function () {
    const wallet = await core.createRandomWallet();
    expect(wallet).to.have.property("address");
    expect(ethers.utils.isAddress(wallet.address)).to.be.true;
  });

  it("Check address's transactions", async function () {
    const wallet = await core.createRandomWallet();
    const hasTxs = await core.hasTransactions(wallet.address);
    expect(hasTxs).to.be.false;

    const [owner] = await ethers.getSigners();
    // 3. 기본 계정에서 임의의 트랜잭션 발생 (self transfer 등)
    await owner.sendTransaction({
      to: owner.address, // 자기 자신에게 이더 전송
      value: ethers.utils.parseEther("0.01"), // 0.01 ETH 전송
    });
    const ownerHasTxs = await core.hasTransactions(owner.address);
    expect(ownerHasTxs).to.be.true;
  });

  it("Should create a new clean wallet", async function () {
    const wallet = await core.createCleanWallet();
    expect(wallet).to.have.property("address");
    expect(ethers.utils.isAddress(wallet.address)).to.be.true;
    expect(await core.hasTransactions(wallet.address)).to.be.false;
  });

  it("Should return the balance of an account", async function () {
    const [owner] = await ethers.getSigners();
    const balance = await core.getAccountBalance(owner.address);
    expect(balance).to.be.a("string");
    expect(parseInt(balance)).to.be.gte(0);
  });

  it("Should validate a correct Ethereum address", function () {
    const validAddress = "0x1234567890abcdef1234567890abcdef12345678";
    expect(core.isEOAValid(validAddress)).to.be.true;
  });

  it("Should invalidate an incorrect Ethereum address", function () {
    const invalidAddress = "0xInvalidAddress123";
    expect(core.isEOAValid(invalidAddress)).to.be.false;
  });

  it("Should perform a batch transfer", async function () {
    const [owner, recipient1, recipient2] = await ethers.getSigners();
    const contract = {
      batchTransfer: async (token, recipients, amounts, options) => {
        return {
          wait: async () => ({ status: 1 }),
        };
      },
    };

    const recipients = [recipient1.address, recipient2.address];
    const amounts = [
      ethers.utils.parseEther("1"),
      ethers.utils.parseEther("1"),
    ];

    const tx = await core.batchTransferAdmin(
      contract,
      ethers.constants.AddressZero,
      recipients,
      amounts
    );
    expect(tx).to.have.property("wait");
  });

  it("Should save wallets to a CSV file", async function () {
    const wallets = [
      { address: "0x123", privateKey: "0xabc" },
      { address: "0x456", privateKey: "0xdef" },
    ];
    const fileName = "test_wallets.csv";

    await core.saveWalletsToCSV(wallets, fileName);

    const fileExists = fs.existsSync(fileName);
    expect(fileExists).to.be.true;

    // Clean up
    fs.unlinkSync(fileName);
  });
});
