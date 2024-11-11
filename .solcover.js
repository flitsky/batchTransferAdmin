module.exports = {
  skipFiles: ["test/mocks/", "interfaces/"],
  mocha: {
    timeout: 60000,
  },
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
