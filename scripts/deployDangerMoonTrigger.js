const hre = require("hardhat");

async function main() {

  const DangerMoonTrigger = await hre.ethers.getContractFactory("DangerMoonTrigger");
  const dangermoonTrigger = await DangerMoonTrigger.deploy();
  await dangermoonTrigger.deployed();
  console.log("DangerMoonTrigger deployed to bsc mainnet:", dangermoonTrigger.address);

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
