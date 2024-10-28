// Import necessary modules and libraries for testing
const { expect } = require("chai"); // Chai is an assertion library for Node.js and browsers
const { ethers } = require("hardhat"); // Hardhat is a development environment for Ethereum software

// Define the test suite for the BatchTransferAdmin contract
describe("BatchTransferAdmin", function () {
  // Declare variables to be used across tests
  let owner, admin1, admin2, nonAdmin, contract, token;

  // Before each test, deploy the contracts and set up initial state
  beforeEach(async function () {
    // Retrieve signers from the Ethereum provider, representing different accounts
    [owner, admin1, admin2, nonAdmin] = await ethers.getSigners();

    // Deploy the BatchTransferAdmin contract
    const BatchTransferAdmin = await ethers.getContractFactory(
      "BatchTransferAdmin"
    );
    contract = await BatchTransferAdmin.deploy();
    await contract.deployed();

    // Deploy a mock ERC20 token for testing purposes
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy(
      "TestToken",
      "TTK",
      ethers.utils.parseEther("1000000")
    );
    await token.deployed();

    // Transfer a portion of tokens to the contract for testing
    await token.transfer(contract.address, ethers.utils.parseEther("10000"));
  });

  // Describe the test suite for admin management functionalities
  describe("Admin Management", function () {
    it("Should deploy and perform basic operations", async function () {
      // Add an admin and verify the addition
      await contract.addAdmin(admin1.address);
      expect(await contract.admins(admin1.address)).to.be.true;

      // Remove the admin and verify the removal
      await contract.removeAdmin(admin1.address);
      expect(await contract.admins(admin1.address)).to.be.false;
    });

    it("Should not allow non-admin to add an admin", async function () {
      // Attempt to add an admin with a non-admin account and expect a revert
      try {
        await contract.connect(nonAdmin).addAdmin(admin1.address);
        throw new Error("Expected transaction to be reverted");
      } catch (err) {
        expect(err.message).to.include("revert");
      }
    });

    it("Should not allow non-admin to remove an admin", async function () {
      // Add an admin first
      await contract.addAdmin(admin1.address);
      // Attempt to remove an admin with a non-admin account and expect a revert
      try {
        await contract.connect(nonAdmin).removeAdmin(admin1.address);
        throw new Error("Expected transaction to be reverted");
      } catch (err) {
        expect(err.message).to.include("revert");
      }
    });

    it("Should allow multiple admins to be added and removed", async function () {
      // Add multiple admins
      await contract.addAdmin(admin1.address);
      await contract.addAdmin(admin2.address);

      // Verify both admins are added
      expect(await contract.admins(admin1.address)).to.be.true;
      expect(await contract.admins(admin2.address)).to.be.true;

      // Remove one admin and verify the state
      await contract.removeAdmin(admin1.address);
      expect(await contract.admins(admin1.address)).to.be.false;
      expect(await contract.admins(admin2.address)).to.be.true;
    });

    it("Owner should be an admin by default", async function () {
      // Verify that the contract owner is an admin by default
      expect(await contract.admins(owner.address)).to.be.true;
    });
  });

  // Describe the test suite for batch Ether transfer functionalities
  describe("Batch Ether Transfers", function () {
    it("[ETH] Should perform a single batch transfer of Ether", async function () {
      // Define recipients and amounts for the batch transfer
      const recipients = [admin1.address];
      const amounts = [ethers.utils.parseEther("1")];

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
          value: ethers.utils.parseEther("1"),
        }
      );

      // Verify the recipient's balance after the transfer
      const balanceAfter = await ethers.provider.getBalance(admin1.address);
      expect(
        balanceAfter.eq(initialBalanceAdmin1.add(ethers.utils.parseEther("1")))
      ).to.be.true;
    });

    it("[ETH] Should perform a batch transfer of Ether to multiple recipients", async function () {
      // Define recipients and amounts for a larger batch transfer
      const recipients = [admin1.address, admin2.address];
      const amounts = [
        ethers.utils.parseEther("1"),
        ethers.utils.parseEther("2"),
      ];

      // Record initial balances of admin1 and admin2
      const initialBalanceAdmin1 = await ethers.provider.getBalance(
        admin1.address
      );
      const initialBalanceAdmin2 = await ethers.provider.getBalance(
        admin2.address
      );

      // Execute the batch transfer of Ether
      await contract.batchTransfer(
        ethers.constants.AddressZero,
        recipients,
        amounts,
        {
          value: ethers.utils.parseEther("3"),
        }
      );

      // Verify each recipient's balance after the transfer
      const balanceAfterAdmin1 = await ethers.provider.getBalance(
        admin1.address
      );
      const balanceAfterAdmin2 = await ethers.provider.getBalance(
        admin2.address
      );
      expect(
        balanceAfterAdmin1.eq(
          initialBalanceAdmin1.add(ethers.utils.parseEther("1"))
        )
      ).to.be.true;
      expect(
        balanceAfterAdmin2.eq(
          initialBalanceAdmin2.add(ethers.utils.parseEther("2"))
        )
      ).to.be.true;
    });

    it("[ETH] Should perform a batch transfer of Ether to 100 recipients", async function () {
      // Define recipients and amounts for a batch transfer of 100 transactions
      const recipients = Array(100).fill(admin1.address);
      const amounts = Array(100).fill(ethers.utils.parseEther("0.01"));

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
          value: ethers.utils.parseEther("1"),
        }
      );

      // Verify the recipient's balance after the transfer
      const balanceAfterAdmin1 = await ethers.provider.getBalance(
        admin1.address
      );
      expect(
        balanceAfterAdmin1.eq(
          initialBalanceAdmin1.add(ethers.utils.parseEther("1"))
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

    it("[ERC20] Should perform a single batch transfer", async function () {
      // Define recipients and amounts for the batch transfer
      const recipients = [admin1.address];
      const amounts = [ethers.utils.parseEther("10")];

      // Execute the batch transfer
      await contract.batchTransfer(token.address, recipients, amounts);

      // Verify the recipient's balance after the transfer
      expect(await token.balanceOf(admin1.address)).to.satisfy((balance) =>
        balance.eq(ethers.utils.parseEther("10"))
      );
    });

    it("[ERC20] Should perform a batch transfer of 100 transactions", async function () {
      // Define recipients and amounts for a larger batch transfer
      const recipients = Array(100).fill(admin1.address);
      const amounts = Array(100).fill(ethers.utils.parseEther("1"));

      // Execute the batch transfer
      await contract.batchTransfer(token.address, recipients, amounts);

      // Verify the recipient's balance after the transfer
      expect(await token.balanceOf(admin1.address)).to.satisfy((balance) =>
        balance.eq(ethers.utils.parseEther("100"))
      );
    });
  });
});

// To Do
// Consider adding additional test cases to further enhance overall functionality coverage,
// such as boundary conditions and event occurrence verification.
