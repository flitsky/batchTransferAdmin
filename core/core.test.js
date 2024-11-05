// Import required libraries for testing
const { expect } = require("chai");
const core = require("../core/core.js");
const { ethers } = require("hardhat");

/**
 * Test Suite for Core.js Module
 * This suite covers functions provided in core.js including account management,
 * transaction checks, balance retrieval, and address validation.
 */

describe("Core Module", function () {
  // Before each test, initialize the provider
  beforeEach(function () {
    core.initProvider("localhost");
  });

  describe("createRandomAccount", function () {
    it("Should create a new random Ethereum account", async function () {
      const account = await core.createRandomAccount();
      expect(account).to.have.property("address");
      expect(ethers.utils.isAddress(account.address)).to.be.true;
    });
  });

  describe("createCleanAccount", function () {
    it("Should create a new clean Ethereum account", async function () {
      const account = await core.createCleanAccount();
      expect(account).to.have.property("address");
      expect(ethers.utils.isAddress(account.address)).to.be.true;
      expect(await core.hasTransactions(account.address)).to.be.false;
    });
  });

  describe("hasTransactions", function () {
    it("Should return false if the account has no transactions", async function () {
      const [owner] = await ethers.getSigners(); // Get the default signer provided by Hardhat
      const hasTxs = await core.hasTransactions(owner.address);
      expect(hasTxs).to.be.false;
    });
  });

  describe("getAccountBalance", function () {
    it("Should return the balance of an account", async function () {
      const [owner] = await ethers.getSigners(); // Get the default signer provided by Hardhat
      const balance = await core.getAccountBalance(owner.address);
      expect(balance).to.be.a("string");
      expect(parseInt(balance)).to.be.gte(0);
    });
  });

  describe("isEOAValid", function () {
    it("Should validate the Ethereum address format correctly", async function () {
      const randAccount = await core.createRandomAccount();
      const fixedAddress = "0x1234567890abcdef1234567890abcdef12345678";
      expect(core.isEOAValid(randAccount.address)).to.be.true;
      expect(core.isEOAValid(fixedAddress)).to.be.true;
    });

    it("Should invalidate incorrect Ethereum address format", function () {
      const isValid = core.isEOAValid("0xInvalidAddress123");
      expect(isValid).to.be.false;
    });
  });
});
