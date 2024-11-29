const fs = require("fs");
const csv = require("fast-csv");

class TransferData {
  constructor(from, to, amount) {
    this.from = from;
    this.to = to;
    this.amount = amount;
  }
}

class WalletData {
  constructor(address, privateKey) {
    this.address = address;
    this.privateKey = privateKey;
  }
}

class CSVParser {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async parseTransferData() {
    const data = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(this.filePath)
        .pipe(csv.parse({ headers: true }))
        .on("data", (row) => {
          try {
            const transferData = new TransferData(
              row.fromAddress,
              row.toAddress,
              parseFloat(row.amount)
            );
            data.push(transferData);
          } catch (error) {
            console.error(`Error parsing row: ${error.message}`);
          }
        })
        .on("end", () => resolve(data))
        .on("error", reject);
    });
  }

  async parseWalletData() {
    const data = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(this.filePath)
        .pipe(csv.parse({ headers: true }))
        .on("data", (row) => {
          try {
            const walletData = new WalletData(row.address, row.privateKey);
            data.push(walletData);
          } catch (error) {
            console.error(`Error parsing row: ${error.message}`);
          }
        })
        .on("end", () => resolve(data))
        .on("error", reject);
    });
  }
}

module.exports = { CSVParser, TransferData, WalletData };
