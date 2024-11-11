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
  mocha: {
    timeout: 60000,
  },
  coverage: {
    timeout: 60000,
    skipFiles: [],
    include: [
      "contracts/**/*.sol", // 컨트랙트 파일
    ],
    exclude: [
      "contracts/test/**/*.sol", // 테스트용 컨트랙트 제외
    ],
    testfiles: [
      "./contracts/**/*.test.js", // 컨트랙트 테스트
      "./core/**/*.test.js", // 코어 로직 테스트
      "./test/**/*.test.js", // 통합/E2E 테스트
    ],
    mocha: {
      timeout: 60000,
    },
  },
  paths: {
    tests: "./test",
  },
};
module.exports = hardhatConfig;
