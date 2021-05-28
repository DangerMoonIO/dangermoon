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

  const UNISWAP_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // pcs v2
  const VRF_COORDINATOR = "0x747973a5A2a4Ae1D3a8fDF5479f1514F65Db9C31";
  const LINK_ADDRESS = '0x404460C6A5EdE2D891e8297795264fDe62ADBB75';
  const LINK_KEYHASH = "0xc251acd21ec4fb7f31bb8868288bfdbaeb4fbfec2df3735ddbd4f7dc8d60103c";
  const dangermoon = await DangerMoon.deploy(UNISWAP_ROUTER, VRF_COORDINATOR, LINK_ADDRESS, LINK_KEYHASH);

  await dangermoon.deployed();

  console.log("DangerMoon deployed to bsc mainnet:", dangermoon.address);

  halfTotalTokenSupply = (await dangermoon.totalSupply()).div(2).toString();
  // await safemoon.approve(UNISWAP_ROUTER, halfTotalTokenSupply);

  const DEAD = '0x000000000000000000000000000000000000dEaD';
  await dangermoon.transfer(DEAD, halfTotalTokenSupply);
  console.log("half total token supply burnt");

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
