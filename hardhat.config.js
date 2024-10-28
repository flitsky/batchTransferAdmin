require("@nomiclabs/hardhat-ethers");
require("solidity-coverage"); // Test coverage
require("dotenv").config();
// import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; // Incorrect import statement

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    amoy: {
      url: process.env.POLYGON_AMOY_RPC_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
  },
};
