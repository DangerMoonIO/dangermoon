const hre = require("hardhat");

async function main() {

  const DANGERMOON_ADDRESS = "0x90c7e271F8307E64d9A1bd86eF30961e5e1031e7";

  // We get the contract to deploy
  const DangerMoonTicTacToe = await hre.ethers.getContractFactory("DangerMoonTicTacToe");
  const tictactoe = await DangerMoonTicTacToe.deploy(DANGERMOON_ADDRESS);
  await tictactoe.deployed();
  console.log("TicTacToe deployed to:", tictactoe.address);

  console.log("creating game...");
  const newGameTx = await tictactoe.newGame(1200);
  await newGameTx.wait();

  // Get dangermoon contract and exclude tictactoe from fees
  const DangerMoon = await ethers.getContractFactory("DangerMoon");
  let dangermoon = await DangerMoon.attach(DANGERMOON_ADDRESS);

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
