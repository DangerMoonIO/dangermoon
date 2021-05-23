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

  // We get the contract to deploy
  const DangerMoon = await hre.ethers.getContractFactory("DangerMoon");
  // TODO double check all:
  const dangermoon = await DangerMoon.deploy(
    "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F", // UniswapV2RouterAddress
    "0x747973a5A2a4Ae1D3a8fDF5479f1514F65Db9C31", // VRF Coordinator address
    "0x404460C6A5EdE2D891e8297795264fDe62ADBB75", // Link Token Address
    "0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311" // keyhash
  );

  await dangermoon.deployed();

  console.log("DangerMoon deployed to:", dangermoon.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
