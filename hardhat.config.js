require("@nomiclabs/hardhat-waffle");
require('hardhat-contract-sizer');

const { ALCHEMY_API_KEY } = require('./secrets.json');

if (process.env.PKEY === undefined) {
  console.error("Please provide PKEY env")
  process.exit(1)
}

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      { version: "0.5.16", },
      { version: "0.6.12", },
    ],
    // settings: {
    //   optimizer: {
    //     enabled: true,
    //     runs: 1000,
    //   },
    // },
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-kovan.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
        accounts: [`0x${process.env.PKEY}`],
        blockNumber: 25066740  // current eth kovan block
      }
    },
    kovan: {
      url: `https://eth-kovan.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.PKEY}`]
    },
    mainnet: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      gasPrice: 5000000000,
      accounts: [`0x${process.env.PKEY}`]
    },
    testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 5000000000,
      accounts: [`0x${process.env.PKEY}`]
    }
  }
};
