require("@nomiclabs/hardhat-ethers");
require("solidity-coverage");
require("dotenv").config();

const hardhatConfig = {
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
      accounts: [
        `0x${process.env.OWNER_PRIVATE_KEY}`, // Owner
        `0x${process.env.ADMIN1_PRIVATE_KEY}`, // Admin 1
        `0x${process.env.ADMIN2_PRIVATE_KEY}`, // Admin 2
        `0x${process.env.NON_ADMIN_PRIVATE_KEY}`, // Non-admin
      ],
      deployed_batch_transfer_address:
        "0xCd3b0FE58cC79152935e77a8E9e43742dc548B1C",
    },
  },
};
module.exports = hardhatConfig;
