const hre = require("hardhat");

async function main() {

  const DangerMoonBulkBuy = await hre.ethers.getContractFactory("DangerMoonBulkBuy");
  const dangermoonBulkBuy = await DangerMoonBulkBuy.deploy();
  await dangermoonBulkBuy.deployed();
  console.log("DangerMoonBulkBuy deployed to bsc mainnet:", dangermoonBulkBuy.address);

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
