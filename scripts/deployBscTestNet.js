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

  const UNISWAP_ROUTER = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
  const VRF_COORDINATOR = "0xa555fC018435bef5A13C6c6870a9d4C11DEC329C";
  const LINK_ADDRESS = '0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06';
  const LINK_KEYHASH = "0xcaf3c3727e033261d383b315559476f48034c13b18f8cafed4d871abe5049186";
  const CHARITY_ADDRESS = "0x5c0e5E0Ccb0DED355EcE0cB6f56B2CE75CB0b8eD";
  const MARKETING_ADDRESS = "0x7817279e3510C2385536b0901de14fCC29e36878";
  const dangermoon = await DangerMoon.deploy(
    UNISWAP_ROUTER,
    VRF_COORDINATOR,
    LINK_ADDRESS,
    LINK_KEYHASH,
    CHARITY_ADDRESS,
    MARKETING_ADDRESS
  );

  await dangermoon.deployed();

  console.log("DangerMoon deployed to bsc testnet:", dangermoon.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
