const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

class NetworkMock {
  constructor() {
    this.mockBalances = new Map();
    this.mockTransactions = new Map();
  }

  // 잔액 모킹
  setBalance(address, balance) {
    this.mockBalances.set(address.toLowerCase(), BigNumber.from(balance));
  }

  // 잔액 조회 모킹
  async getBalance(address) {
    const balance = this.mockBalances.get(address.toLowerCase());
    return balance || ethers.utils.parseEther("1.0"); // 기본값
  }

  // 트랜잭션 응답 모킹
  async mockTransactionResponse() {
    const mockTx = {
      hash: "0x" + "1".repeat(64),
      wait: async () => ({
        status: 1, // 성공 상태를 나타내는 1
        events: [],
        logs: [],
        transactionHash: "0x" + "1".repeat(64),
        blockNumber: 1,
        blockHash: "0x" + "2".repeat(64),
        confirmations: 1,
        from: "0x" + "3".repeat(40),
        to: "0x" + "4".repeat(40),
        gasUsed: BigNumber.from(21000),
      }),
    };

    return mockTx;
  }

  // 잔액 업데이트 모킹
  async updateBalances(recipients, amounts) {
    for (let i = 0; i < recipients.length; i++) {
      const currentBalance = await this.getBalance(recipients[i]);
      this.setBalance(recipients[i], currentBalance.add(amounts[i]));
    }
  }
}

module.exports = NetworkMock;
