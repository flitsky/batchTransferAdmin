// Import required libraries for testing
const { expect } = require("chai");
const core = require("../core/core.js");
const { ethers } = require("hardhat");
const Web3 = require("web3");
const NetworkMock = require("../test/helpers/networkMock");

/**
 * Test Suite for BatchTransferAdmin Contract
 * This suite covers admin management and batch transfer functionalities.
 */

// Define the test suite for the BatchTransferAdmin contract
describe("BatchTransferAdmin", function () {
  // Declare variables to be used across tests
  let owner, admin1, admin2, nonAdmin, contract, token;
  let networkMock;

  // Before each test, deploy the contracts and set up initial state
  beforeEach(async function () {
    // Step 1: Setup signers representing different accounts
    [owner, admin1, admin2, nonAdmin] = await ethers.getSigners();

    // Step 2: Deploy BatchTransferAdmin contract
    const BatchTransferAdmin = await ethers.getContractFactory(
      "BatchTransferAdmin"
    );
    contract = await BatchTransferAdmin.deploy();
    await contract.deployed();

    // Step 3: Deploy a mock ERC20 token for testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy(
      "TestToken",
      "TTK",
      ethers.utils.parseEther("1000000")
    );
    await token.deployed();

    // Step 4: Transfer tokens to the contract
    await token.transfer(contract.address, ethers.utils.parseEther("10000"));

    if (process.env.COVERAGE === "true") {
      // 테스트용 초기 잔액 설정
      networkMock.setBalance(owner.address, ethers.utils.parseEther("10.0"));
      networkMock.setBalance(admin1.address, ethers.utils.parseEther("1.0"));
      networkMock.setBalance(admin2.address, ethers.utils.parseEther("1.0"));
    }
  });

  // Admin management test cases
  describe("Admin Management", function () {
    it("Should deploy and allow admin operations", async function () {
      await contract.addAdmin(admin1.address); // Add an admin
      expect(await contract.admins(admin1.address)).to.be.true; // Verify addition

      await contract.removeAdmin(admin1.address); // Remove the admin
      expect(await contract.admins(admin1.address)).to.be.false; // Verify removal
    });

    it("Should reject non-admin admin addition", async function () {
      // Attempt to add an admin with a non-admin account and expect a revert
      try {
        await contract.connect(nonAdmin).addAdmin(admin1.address);
        throw new Error("Expected transaction to be reverted");
      } catch (err) {
        expect(err.message).to.include("revert");
      }
    });

    it("Owner should be an admin by default", async function () {
      // Verify that the contract owner is an admin by default
      expect(await contract.admins(owner.address)).to.be.true;
    });
  });

  // Ether batch transfer test cases
  describe("Batch Ether Transfers", function () {
    it("[ETH] Should execute a single batch Ether transfer", async function () {
      // Define recipients and amounts for the batch transfer
      const recipients = [admin1.address];
      const amounts = [ethers.utils.parseEther("1")];

      // Record initial balance of admin1
      const initialBalance = await ethers.provider.getBalance(admin1.address);

      // Execute the batch transfer of Ether
      await contract.batchTransfer(
        ethers.constants.AddressZero,
        recipients,
        amounts,
        {
          value: ethers.utils.parseEther("1"),
        }
      );

      // Verify the recipient's balance after the transfer
      const newBalance = await ethers.provider.getBalance(admin1.address);
      expect(newBalance.eq(initialBalance.add(ethers.utils.parseEther("1")))).to
        .be.true;
    });

    it("[ETH] Should perform a batch transfer of Ether to 10 recipients", async function () {
      // Define recipients and amounts for a batch transfer of 100 transactions
      const recipients = Array(10).fill(admin1.address);
      const amounts = Array(10).fill(ethers.utils.parseEther("0.01"));

      // Record initial balance of admin1
      const initialBalanceAdmin1 = await ethers.provider.getBalance(
        admin1.address
      );

      // Execute the batch transfer of Ether
      await contract.batchTransfer(
        ethers.constants.AddressZero,
        recipients,
        amounts,
        {
          value: ethers.utils.parseEther("0.1"),
        }
      );

      // Verify the recipient's balance after the transfer
      const balanceAfterAdmin1 = await ethers.provider.getBalance(
        admin1.address
      );
      expect(
        balanceAfterAdmin1.eq(
          initialBalanceAdmin1.add(ethers.utils.parseEther("0.1"))
        )
      ).to.be.true;
    });

    it("[ETH] Should fail if insufficient Ether is provided", async function () {
      // Define recipients and amounts for the batch transfer
      const recipients = [admin1.address, admin2.address];
      const amounts = [
        ethers.utils.parseEther("1"),
        ethers.utils.parseEther("2"),
      ];

      // Attempt to execute the batch transfer with insufficient Ether
      try {
        await contract.batchTransfer(
          ethers.constants.AddressZero,
          recipients,
          amounts,
          {
            value: ethers.utils.parseEther("1"),
          }
        );
        throw new Error("Expected transaction to be reverted");
      } catch (err) {
        expect(err.message).to.include("revert");
      }
    });
  });

  // Describe the test suite for batch ERC20 transfer functionalities
  describe("Batch ERC20 Transfers", function () {
    beforeEach(async function () {
      // Approve the contract to spend a large amount of tokens on behalf of the owner
      await token.approve(contract.address, ethers.utils.parseEther("1000000"));
    });

    it("[ERC20] Should perform a batch transfer of ERC20 to 10 recipients", async function () {
      // Define recipients and amounts for a larger batch transfer
      const recipients = Array(10).fill(admin1.address);
      const amounts = Array(10).fill(ethers.utils.parseEther("0.01"));

      // Execute the batch transfer
      await contract.batchTransfer(token.address, recipients, amounts);

      // Verify the recipient's balance after the transfer
      expect(await token.balanceOf(admin1.address)).to.satisfy((balance) =>
        balance.eq(ethers.utils.parseEther("0.1"))
      );
    });
  });
});

// To Do
// Consider adding additional test cases to further enhance overall functionality coverage,
// such as boundary conditions and event occurrence verification.
