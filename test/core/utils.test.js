const { expect } = require("chai");
const { createRandomWallets } = require("../../core/utils");

describe("Utils Module", function () {
  it("should create a specified number of random wallets", async function () {
    const wallets = await createRandomWallets(5);
    expect(wallets).to.have.lengthOf(5);
    wallets.forEach((wallet) => {
      expect(wallet).to.have.property("address");
      expect(wallet).to.have.property("privateKey");
    });
  });
});
