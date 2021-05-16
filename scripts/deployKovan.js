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

  // Same as test config for deploying to kovan
  const UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const VRF_COORDINATOR = "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9";
  const LINK_ADDRESS = '0xa36085F69e2889c224210F603D836748e7dC0088';
  const LINK_KEYHASH = "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";
  const dangermoon = await DangerMoon.deploy(UNISWAP_ROUTER, VRF_COORDINATOR, LINK_ADDRESS, LINK_KEYHASH);

  await dangermoon.deployed();

  console.log("DangerMoon deployed to kovan:", dangermoon.address);

  halfTotalTokenSupply = (await dangermoon.totalSupply()).div(2).toString();
  await dangermoon.approve(UNISWAP_ROUTER, halfTotalTokenSupply);

  await dangermoon.setSwapAndLiquifyEnabled(false);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
