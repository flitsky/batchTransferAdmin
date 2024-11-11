const { expect } = require("chai");
const { ethers } = require("hardhat");
const NetworkMock = require("../test/helpers/networkMock");

describe("MockERC20", function () {
  let mockToken;
  let owner;
  let addr1;
  let networkMock;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    if (process.env.COVERAGE === "true") {
      networkMock = new NetworkMock();
      networkMock.setBalance(owner.address, ethers.utils.parseEther("10.0"));
    }

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Mock Token", "MTK");
    await mockToken.deployed();
  });

  describe("Basic Token Operations", function () {
    it("Should have correct name and symbol", async function () {
      expect(await mockToken.name()).to.equal("Mock Token");
      expect(await mockToken.symbol()).to.equal("MTK");
    });

    it("Should mint tokens", async function () {
      const amount = ethers.utils.parseEther("100");
      await mockToken.mint(addr1.address, amount);
      expect(await mockToken.balanceOf(addr1.address)).to.equal(amount);
    });
  });
});
