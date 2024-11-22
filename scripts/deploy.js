// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // BatchTransferAdmin 배포
  const BatchTransferAdmin = await ethers.getContractFactory(
    "BatchTransferAdmin"
  );
  const batchTransferAdmin = await BatchTransferAdmin.deploy();
  await batchTransferAdmin.deployed();

  console.log(
    `BatchTransferAdmin contract deployed to: ${batchTransferAdmin.address}`
  );

  // MockERC20 배포
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockERC20Contract = await MockERC20.deploy(
    "Mock Token",
    "MCK",
    ethers.utils.parseEther("1000000")
  );
  await mockERC20Contract.deployed();
  console.log(`MockERC20 contract deployed to: ${mockERC20Contract.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
