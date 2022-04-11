const hre = require("hardhat");

async function main() {

  const DangerMoonMultiSend = await hre.ethers.getContractFactory("DangerMoonMultiSend");
  const dangermoonMultiSend = await DangerMoonMultiSend.deploy();
  await dangermoonMultiSend.deployed();
  console.log("DangerMoonMultiSend deployed to bsc mainnet:", dangermoonMultiSend.address);

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
