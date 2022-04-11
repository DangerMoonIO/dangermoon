const hre = require("hardhat");

async function main() {

  const MULTIBUY_ADDRESS = "0xBF36Cd184c6b8270b67aaCb4EB9B4B5923dde8ec"

  const DangerMoonMultiBuy = await hre.ethers.getContractFactory("DangerMoonMultiBuy");
  let multibuy = await DangerMoonMultiBuy.attach(MULTIBUY_ADDRESS);

  console.log("Updating multibuy commission...");
  const setCommissionTx = await multibuy.setCommission("20000000000000000");
  console.log(await setCommissionTx.wait());

  const commission = (await multibuy.commission()).toString();
  console.log("DangerMoonMultiBuy commission updated:", commission);

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
