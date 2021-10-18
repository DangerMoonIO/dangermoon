const hre = require("hardhat");

async function main() {

  // most recently deployed dangermoon on kovan
  const DANGERMOON_KOVAN_ADDRESS = "0x90A7b170F713f96775e5aa750425a93F9ca1B26E";

  // We get the contract to deploy
  const DangerMoonTicTacToe = await hre.ethers.getContractFactory("DangerMoonTicTacToe");
  const tictactoe = await DangerMoonTicTacToe.deploy(DANGERMOON_KOVAN_ADDRESS);
  await tictactoe.deployed();
  console.log("TicTacToe deployed to kovan:", tictactoe.address);

  console.log("creating game...");
  const newGameTx = await tictactoe.newGame(1200);
  await newGameTx.wait();

  // Get dangermoon contract and exclude tictactoe from fees
  const DangerMoon = await ethers.getContractFactory("DangerMoon");
  let dangermoon = await DangerMoon.attach(DANGERMOON_KOVAN_ADDRESS);

  console.log("excluding from fees...");
  const excludeTx = await dangermoon.excludeFromFee(tictactoe.address);
  await excludeTx.wait();

  // Verify that we excluded tictactoe from fees
  const isExcludedFromFee = await dangermoon.isExcludedFromFee(tictactoe.address);
  console.log("isExcludedFromFee", isExcludedFromFee);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
