require("@nomiclabs/hardhat-waffle");

const { ALCHEMY_API_KEY, PRIVATE_KEY } = require('./secrets.json');

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
  solidity: "0.6.12",
  // solidity: {
  //   compilers: [
  //     {
  //       version: "0.8.0"
  //     },
  //     {
  //       version: "0.6.0"
  //     },
  //     {
  //       version: "0.6.12"
  //     }
  //   ]
  // },
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-kovan.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
        accounts: [`0x${PRIVATE_KEY}`],
        // blockNumber: 5289860 // block when safemoon was deployed to BSC
        blockNumber: 24996607 // current eth kovan block
      }
    },
    kovan: {
      url: `https://eth-kovan.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [`0x${PRIVATE_KEY}`]
    }
  }
};
