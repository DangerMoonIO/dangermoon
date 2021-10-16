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

  const DANGERMOON_ADDRESS = "0x90c7e271F8307E64d9A1bd86eF30961e5e1031e7";

  // We get the contract to deploy
  const DangerMoonTicTacToe = await hre.ethers.getContractFactory("DangerMoonTicTacToe");
  const tictactoe = await DangerMoonTicTacToe.deploy(DANGERMOON_ADDRESS);
  await tictactoe.deployed();
  console.log("TicTacToe deployed to kovan:", tictactoe.address);
  await tictactoe.newGame(1200);

  // Get dangermoon contract and exclude tictactoe from fees
  const DangerMoon = await ethers.getContractFactory("DangerMoon");
  let dangermoon = await DangerMoon.attach(DANGERMOON_ADDRESS);
  const excludeTx = await dangermoon.excludeFromFee(tictactoe.address);
  await excludeTx.wait();

  // Verify that we excluded tictactoe from fees
  const isExcludedFromFee = await dangermoon.excludeFromFee(tictactoe.address);
  console.log("isExcludedFromFee", isExcludedFromFee);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
