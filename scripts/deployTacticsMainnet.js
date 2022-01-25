const hre = require("hardhat");

async function main() {

  // mainnet dangermoon
  const DANGERMOON_ADDRESS = "0x90c7e271F8307E64d9A1bd86eF30961e5e1031e7";

  // // We get the contract to deploy
  const DangerMoonTactics = await hre.ethers.getContractFactory("DangerMoonTactics");
  const tactics = await DangerMoonTactics.deploy(DANGERMOON_ADDRESS);
  await tactics.deployed();
  console.log("Tactics deployed to mainnet:", tactics.address);

  // const DangerMoonTactics = await ethers.getContractFactory("DangerMoonTactics");
  // let tactics = await DangerMoonTactics.attach("0x30715124F51F6c67AA2Ef9bcaD900de1469a6a85");

  const DangerMoon = await ethers.getContractFactory("DangerMoon");
  let dangermoon = await DangerMoon.attach(DANGERMOON_ADDRESS);

  console.log("approving...");
  const approveTx = await dangermoon.approve(tactics.address, "10000000000000000000000");
  await approveTx.wait();

  console.log("creating game...");
  const blocksPerTurn = 28800;  // ~1 day at 3s/block
  const energyFeePercent = 100; // ~$10
  const entryFeePercent = 10;   // ~$1
  const createGameTx = await tactics.createGame(10, blocksPerTurn, energyFeePercent, entryFeePercent);
  await createGameTx.wait();

  console.log("locking new games...");
  const lockGameTx = await tactics.setLockNewGame(true);
  await lockGameTx.wait();

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
