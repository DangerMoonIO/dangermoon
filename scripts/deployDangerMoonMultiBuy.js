const hre = require("hardhat");

async function main() {

  const DangerMoonMultiBuy = await hre.ethers.getContractFactory("DangerMoonMultiBuy");
  const dangermoonMultiBuy = await DangerMoonMultiBuy.deploy();
  await dangermoonMultiBuy.deployed();
  console.log("DangerMoonMultiBuy deployed to bsc mainnet:", dangermoonMultiBuy.address);

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
