const { Web3 } = require('web3');
const { ethers } = require('hardhat');
require("dotenv").config();

// Account configurations
const accounts = [
    `0x${process.env.OWNER_PRIVATE_KEY}`, // Owner
    `0x${process.env.ADMIN1_PRIVATE_KEY}`, // Admin 1
    `0x${process.env.ADMIN2_PRIVATE_KEY}`, // Admin 2
    `0x${process.env.NON_ADMIN_PRIVATE_KEY}`, // Non-admin
];

// Network configurations
const networks = {
    polygon: {
        mainnet: {
            rpc: process.env.POLYGON_MAINNET_RPC_URL || 'https://polygon-rpc.com',
            chainId: 137,
            name: 'Polygon Mainnet',
            explorer: 'https://polygonscan.com'
        },
        amoy: {
            rpc: process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
            chainId: 80002,
            name: 'Polygon Amoy',
            explorer: 'https://www.oklink.com/amoy'
        }
    },
};

// Contract configurations
const contracts = {
    batchTransferAdmin: {
        address: process.env.BATCH_TRANSFER_ADMIN_ADDRESS,
        name: 'BatchTransferAdmin'
    },
    // Add other contracts here
};

// Gas configurations
const gasConfig = {
    maxFeePerGas: ethers.utils.parseUnits('100', 'gwei'),
    maxPriorityFeePerGas: ethers.utils.parseUnits('10', 'gwei'),
    gasLimit: 500000
};

// Utility functions
const utils = {
    getWeb3Instance: (network, chain) => {
        const networkConfig = networks[network]?.[chain];
        if (!networkConfig) {
            throw new Error(`Network configuration not found for ${network} ${chain}`);
        }
        return new Web3(networkConfig.rpc);
    },

    // initializeTestNetwork: async (network = 'polygon', chain = 'amoy') => {
    //     const networkConfig = networks[network]?.[chain];
    //     if (!networkConfig) {
    //         throw new Error(`Network configuration not found for ${network} ${chain}`);
    //     }

    //     const web3 = utils.getWeb3Instance(network, chain);
        
    //     // Initialize accounts
    //     const wallets = {};
    //     for (const [accountType, privateKey] of Object.entries(accounts)) {
    //         if (!privateKey) {
    //             throw new Error(`Private key not found for ${accountType}`);
    //         }
    //         wallets[accountType] = new ethers.Wallet(privateKey, ethers.provider);
    //     }

    //     return {
    //         web3,
    //         wallets,
    //         networkConfig,
    //         async connectContract(contractName, contractAddress) {
    //             const Contract = await ethers.getContractFactory(contractName);
    //             return await Contract.attach(contractAddress);
    //         }
    //     };
    // },

    checkNetworkConnection: async (network, chain) => {
        try {
            const web3 = utils.getWeb3Instance(network, chain);
            await web3.eth.net.isListening();
            return true;
        } catch (error) {
            console.error(`Failed to connect to ${network} ${chain}:`, error.message);
            return false;
        }
    }
};

const moduleConfig = {
    accounts,
    networks,
    contracts,
    gasConfig,
    utils
};

module.exports = moduleConfig;
