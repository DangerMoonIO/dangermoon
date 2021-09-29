// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // most recently deployed dangermoon on kovan
  const DANGERMOON_KOVAN_ADDRESS = "0xfa1e56f8bc6af69ce4ae36f2e6e5412e06fc6e57";

  // We get the contract to deploy
  const tictactoe = await TicTacToe.deploy(DANGERMOON_KOVAN_ADDRESS);

  await tictactoe.deployed();

  console.log("TicTacToe deployed to kovan:", tictactoe.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
