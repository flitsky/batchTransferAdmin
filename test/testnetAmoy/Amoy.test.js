// Import necessary modules
const { expect } = require("chai");
const { ethers } = require("hardhat");
const moduleConf = require("../../config/config.js");

// Define the test suite for the BatchTransferAdmin contract on testnet
describe("BatchTransferAdmin Tests on Amoy Testnet", function () {
  // Declare variables to be used across tests
  let owner, admin1, admin2, nonAdmin, contract, token;

  // Before each test, deploy the contracts and set up initial state
  before(async function () {
    // 개인 키를 Wallet 객체로 변환하고 Signer로 설정
    const moduleWallets = moduleConf.accounts.map(
      (privateKey) => new ethers.Wallet(privateKey, ethers.provider)
    );

    [owner, admin1, admin2, nonAdmin] = await Promise.all(
      moduleWallets.map((wallet) => wallet.connect(ethers.provider))
    );

    // Attach to the already deployed BatchTransferAdmin contract
    const BatchTransferAdmin = await ethers.getContractFactory(
      "BatchTransferAdmin"
    );
    const deployedContractAddress =
      "0xCd3b0FE58cC79152935e77a8E9e43742dc548B1C";
    contract = await BatchTransferAdmin.attach(deployedContractAddress);

    // 네트워크 체인 정보 주입
    // Amoy 테스트넷 연결 설정
    // const networkConnection = await config.utils.initializeTestNetwork('polygon', 'amoy');
    // web3 = networkConnection.web3;

    // owner EOA 트랜잭션 존재 여부 확인
    // const hasTransactions = await core.hasTransactions(web3, owner.address);
    // console.log("Has transactions:", hasTransactions);
  });

  it("Checks Owner Account's transaction count on Polygon Amoy", async function () {
    const account = owner;
    console.log("Owner Account:", account.address);

    const balance = await ethers.provider.getBalance(account.address);
    console.log("Balance:", ethers.utils.formatEther(balance));

    // Check if the account has any transactions by checking the transaction count
    const transactionCount = await ethers.provider.getTransactionCount(
      account.address
    );
    const hasTransactions = transactionCount > 0;
    console.log("Has transactions:", hasTransactions, transactionCount);
    console.log(
      "https://amoy.polygonscan.com/address/0xCd3b0FE58cC79152935e77a8E9e43742dc548B1C"
    );
  });

  it("Random Account Generation on Polygon Amoy", async function () {
    const randomAccount = ethers.Wallet.createRandom();
    console.log("Random Account:", randomAccount.address);

    const balance = await ethers.provider.getBalance(randomAccount.address);
    console.log("Balance:", ethers.utils.formatEther(balance));

    // Check if the account has any transactions by checking the transaction count
    const transactionCount = await ethers.provider.getTransactionCount(
      randomAccount.address
    );
    const hasTransactions = transactionCount > 0;
    console.log("Has transactions:", hasTransactions, transactionCount);
  });

  it.skip("Should perform a batch transfer on Polygon Amoy", async function () {
    const recipients = [admin1.address, admin2.address];
    const amounts = [
      ethers.utils.parseEther("0.0123"),
      ethers.utils.parseEther("0.0135"),
    ];
    // Calculate total amount to be sent
    const totalAmount = amounts.reduce(
      (acc, amount) => acc.add(amount),
      ethers.BigNumber.from(0)
    );

    // 수신자들의 수신 전 잔액 확인
    const balancesBefore = await Promise.all(
      recipients.map((address) => ethers.provider.getBalance(address))
    );

    // 트랜잭션 전송 및 트랜잭션 객체 수신
    const tx = await contract.batchTransfer(
      ethers.constants.AddressZero,
      recipients,
      amounts,
      {
        value: totalAmount,
      }
    );

    // 트랜잭션이 컨컴될 때까지 대기
    const receipt = await tx.wait(3); // 3 confirmations

    // 트랜잭션이 성공적으로 컨컴되었는지 확인
    expect(receipt.status).to.equal(1);

    // 트랜잭션 수신자의 잔액 확인
    const balancesAfter = await Promise.all(
      recipients.map((address) => ethers.provider.getBalance(address))
    );

    // 각 수신자에 대해 송금 금액과 잔액 변화를 검증
    for (let i = 0; i < recipients.length; i++) {
      const balanceChange = balancesAfter[i].sub(balancesBefore[i]);
      expect(balanceChange.toString()).to.equal(amounts[i].toString());
    }
  });
});
