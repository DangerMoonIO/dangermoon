const hre = require("hardhat");

async function main() {

  const DangerMoonMarketing = await hre.ethers.getContractFactory("DangerMoonMarketing");
  const dangermoonMarketing = await DangerMoonMarketing.deploy();
  await dangermoonMarketing.deployed();
  console.log("DangerMoonMarketing deployed to bsc mainnet:", dangermoonMarketing.address);

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
