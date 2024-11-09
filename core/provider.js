const { ethers } = require("hardhat");

let provider = ethers.provider;

/**
 * @param {string} network - The network to connect to
 * @returns {ethers.providers.JsonRpcProvider} - Returns the provider
 */
function initProvider(network) {
  provider = network
    ? new ethers.providers.JsonRpcProvider(network)
    : ethers.provider;
  return provider;
}

module.exports = {
  initProvider,
  getProvider: () => provider,
};
