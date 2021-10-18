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
  const DANGERMOON_KOVAN_ADDRESS = "0x90A7b170F713f96775e5aa750425a93F9ca1B26E";

  // We get the contract to deploy
  const DangerMoonTactics = await hre.ethers.getContractFactory("DangerMoonTactics");

  const blocksPerTurn = 10;
  const tactics = await DangerMoonTactics.deploy(DANGERMOON_KOVAN_ADDRESS, blocksPerTurn);

  await tactics.deployed();

  console.log("Tactics deployed to kovan:", tactics.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
