const hre = require("hardhat");

async function main() {

  // We get the contract to deploy
  const DangerMoonReferral = await hre.ethers.getContractFactory("DangerMoonReferral");
  const referral = await DangerMoonReferral.deploy();
  await referral.deployed();
  console.log("Referral deployed to:", referral.address);

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
