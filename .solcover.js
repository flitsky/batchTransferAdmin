module.exports = {
  skipFiles: [],
  mocha: {
    timeout: 60000,
  },
  testfiles: [
    "./contracts/**/*.test.js",
    "./core/**/*.test.js",
    "./test/**/*.test.js",
  ],
  configureYulOptimizer: true,
  solcOptimizerDetails: {
    peephole: false,
    jumpdestRemover: false,
    orderLiterals: false,
    deduplicate: false,
    cse: false,
    constantOptimizer: false,
    yul: false,
  },
};
