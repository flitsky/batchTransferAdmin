// scripts/deploy.js
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const BatchTransferAdmin = await ethers.getContractFactory(
    "BatchTransferAdmin"
  );
  const contract = await BatchTransferAdmin.deploy();

  console.log("BatchTransferAdmin contract deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
