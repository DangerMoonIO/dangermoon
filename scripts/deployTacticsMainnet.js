const hre = require("hardhat");

async function main() {

  // most recently deployed dangermoon on mainnet
  const DANGERMOON_KOVAN_ADDRESS = "0x90c7e271F8307E64d9A1bd86eF30961e5e1031e7";

  // We get the contract to deploy
  const DangerMoonTactics = await hre.ethers.getContractFactory("DangerMoonTactics");

  const blocksPerTurn = 28800; // ~1 day at 3s/block
  const tactics = await DangerMoonTactics.deploy(DANGERMOON_KOVAN_ADDRESS, blocksPerTurn);
  await tactics.deployed();
  console.log("Tactics deployed to mainnet:", tactics.address);

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
