const hre = require("hardhat");

async function main() {

  // most recently deployed dangermoon on kovan
  const DANGERMOON_KOVAN_ADDRESS = "0x90A7b170F713f96775e5aa750425a93F9ca1B26E";

  // We get the contract to deploy
  const DangerMoonTactics = await hre.ethers.getContractFactory("DangerMoonTactics");

  const blocksPerTurn = 120;
  const tactics = await DangerMoonTactics.deploy(DANGERMOON_KOVAN_ADDRESS, blocksPerTurn);
  await tactics.deployed();
  console.log("Tactics deployed to kovan:", tactics.address);

  // Get dangermoon contract and exclude tactics from fees
  const DangerMoon = await ethers.getContractFactory("DangerMoon");
  let dangermoon = await DangerMoon.attach(DANGERMOON_KOVAN_ADDRESS);

  console.log("approving...");
  const approveTx = await dangermoon.approve(tactics.address, "10000000000000000000000");
  await approveTx.wait();

  console.log("creating game...");
  const createGameTx = await tactics.createGame(10);
  await createGameTx.wait();

  console.log("excluding from fees...");
  const excludeTx = await dangermoon.excludeFromFee(tactics.address);
  await excludeTx.wait();

  // Verify that we excluded tactics from fees
  const isExcludedFromFee = await dangermoon.isExcludedFromFee(tactics.address);
  console.log("isExcludedFromFee", isExcludedFromFee);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
